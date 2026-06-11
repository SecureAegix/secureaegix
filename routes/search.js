const express = require("express");
const router = express.Router();
const Course = require("../models/cources");
const Blog = require("../models/blog");

// ==================== SECURITY CONFIGURATION ====================

// Blocked search terms - sensitive keywords
const BLOCKED_TERMS = [
  "admin", "administrator", "root", "password", "passwd", 
  "secret", "credential", "login", "auth", "authentication",
  "database", "config", "configuration", "backup", "dump"
];

// Dangerous patterns - HTML/JS injection attempts
const DANGEROUS_PATTERNS = [
  // HTML Tags
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>[\s\S]*?<\/embed>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>[\s\S]*?<\/style>/gi,
  /<[^>]*on\w+\s*=[^>]*>/gi, // Event handlers like onclick, onload
  /javascript:/gi,
  /vbscript:/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
  
  // JS Code patterns
  /eval\s*\(/gi,
  /document\.(write|cookie|location)/gi,
  /window\.(location|alert|eval)/gi,
  /\.innerHTML\s*=/gi,
  /\.outerHTML\s*=/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /Function\s*\(/gi,
  /new\s+Function/gi,
  
  // SQL Injection patterns
  /(\bSELECT\b.*\bFROM\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi,
  /(\bUPDATE\b.*\bSET\b)/gi,
  /(\bDELETE\b.*\bFROM\b)/gi,
  /(\bDROP\b.*\bTABLE\b)/gi,
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bOR\b.*=.*=)/gi,
  /(\bAND\b.*=.*=)/gi,
  /(--|\#|\/\*)/gi, // SQL comments
  /(\bEXEC\b.*\bXP_)/gi,
  
  // NoSQL Injection patterns
  /\$gt|\$lt|\$eq|\$ne|\$in|\$nin|\$or|\$and|\$not|\$where|\$regex/gi,
  /\$\$?[a-zA-Z]+/gi, // MongoDB operators like $where, $inc
  
  // Path Traversal
  /\.\.\/|\.\.\\/gi,
  /\/etc\/passwd|\\windows\\win\.ini/gi,
  
  // Command Injection
  /[;&|`$]|\b(exec|system|popen|shell_exec|eval|assert)\s*\(/gi,
  
  // Encoded attacks
  /\%3C|\%3E|\%22|\%27|\%3B|\%26|\%7C|\%60|\%24/gi, // Encoded <, >, ", ', ;, &, |, `, $
  /\\x[0-9a-f]{2}/gi, // Hex encoded
  /\\u[0-9a-f]{4}/gi  // Unicode encoded
];

// Maximum query length to prevent buffer overflow
const MAX_QUERY_LENGTH = 100;

// Allowed characters pattern (alphanumeric, spaces, basic punctuation)
const ALLOWED_CHARS = /^[a-zA-Z0-9\s\-_.,?!@#$%^&*()+=:;'"\[\]{}|\\/]+$/;

// ==================== SECURITY FUNCTIONS ====================

// Escape regex special characters (FIXED: Now a regular function, not using 'this')
function escapeRegex(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Check if query contains blocked term (FIXED: Now calling escapeRegex correctly)
function containsBlockedTerm(query) {
  const lowerQuery = query.toLowerCase();
  return BLOCKED_TERMS.some(term => {
    const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    return wordBoundaryRegex.test(lowerQuery);
  });
}

// Check for dangerous patterns
function containsDangerousPattern(query) {
  try {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(query)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Pattern matching error:", error);
    return true; // Fail safe - block if pattern matching fails
  }
}

// Sanitize query - remove dangerous characters
function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = query.trim();
  
  // Limit length
  if (sanitized.length > MAX_QUERY_LENGTH) {
    sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// Validate query is safe for database search
function isSafeQuery(query) {
  if (!query || query.length < 2) {
    return false;
  }
  
  // Check if contains only allowed characters
  if (!ALLOWED_CHARS.test(query)) {
    return false;
  }
  
  return true;
}

// Escape HTML to prevent XSS in response
function escapeHtml(text) {
  if (!text) return text;
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return text.replace(/[&<>"'\/`=]/g, (char) => htmlEscapes[char]);
}

// Log security events
function logSecurityEvent(eventType, query, ip, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    query,
    ip,
    ...details
  };
  console.warn("Security Alert:", JSON.stringify(logEntry));
  // Here you could also save to a database or external logging service
}

// ===================== MAIN SEARCH API =====================

router.get("/api/search", async (req, res) => {
  let query = req.query.q;
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  
  try {
    // 1. Input validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "Search query is required",
        results: [] 
      });
    }
    
    // 2. Sanitize query
    let sanitizedQuery = sanitizeQuery(query);
    
    // 3. Check for basic length requirement
    if (sanitizedQuery.length < 2) {
      return res.json({ results: [], message: "Query too short" });
    }
    
    // 4. Check for dangerous patterns (HTML/JS/SQL/NoSQL injection)
    if (containsDangerousPattern(sanitizedQuery)) {
      logSecurityEvent('DANGEROUS_PATTERN', sanitizedQuery, clientIp, {
        reason: 'HTML/JS/SQL injection attempt detected'
      });
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Search contains potentially dangerous content",
        results: [] 
      });
    }
    
    // 5. Check for blocked terms
    if (containsBlockedTerm(sanitizedQuery)) {
      logSecurityEvent('BLOCKED_TERM', sanitizedQuery, clientIp);
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "This search term is not allowed",
        results: [] 
      });
    }
    
    // 6. Validate safe characters
    if (!isSafeQuery(sanitizedQuery)) {
      logSecurityEvent('INVALID_CHARS', sanitizedQuery, clientIp);
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Search contains invalid characters",
        results: [] 
      });
    }
    
    // 7. Escape regex special characters for safe MongoDB query
    const escapedQuery = escapeRegex(sanitizedQuery);
    const searchRegex = new RegExp(escapedQuery, "i");
    
    // 8. Search Courses with safe parameters
    const courses = await Course.find({
      $or: [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { courceType: searchRegex },
        { "teacher.name": searchRegex }
      ],
      isActive: true
    })
    .populate("teacher", "name")
    .limit(4)
    .lean()
    .catch(err => {
      console.error("Course search error:", err);
      return [];
    });
    
    // 9. Search Blogs with safe parameters
    const blogs = await Blog.find({
      $or: [
        { title: searchRegex },
        { shortdescription: searchRegex },
        { category: searchRegex },
        { Keywords: searchRegex }
      ],
      blocked: false,
      isvalid: true
    })
    .populate("author", "name")
    .limit(3)
    .lean()
    .catch(err => {
      console.error("Blog search error:", err);
      return [];
    });
    
    // 10. Static Pages (ensure no sensitive pages are exposed)
    const pages = [
      { title: "About Us", url: "/about", description: "Learn about SecureAegix - Cybersecurity training platform", icon: "fas fa-info-circle", color: "green" },
      { title: "Contact Us", url: "/contact", description: "Get in touch with our support team", icon: "fas fa-envelope", color: "blue" },
      { title: "Careers", url: "/careers", description: "Join our team of cybersecurity experts", icon: "fas fa-briefcase", color: "purple" },
      { title: "Privacy Policy", url: "/privacy", description: "Read our privacy and data protection policy", icon: "fas fa-shield-alt", color: "indigo" },
      { title: "Terms & Conditions", url: "/terms", description: "Terms of service and usage guidelines", icon: "fas fa-file-contract", color: "gray" }
    ];
    
    const services = [
      { title: "Penetration Testing", url: "/services/penetration-testing", description: "Professional security testing to identify vulnerabilities", icon: "fas fa-bug", color: "blue" },
      { title: "Vulnerability Assessment", url: "/services/vulnerability-assessment", description: "Comprehensive security assessment and scanning", icon: "fas fa-search", color: "cyan" },
      { title: "Incident Response", url: "/services/incident-response", description: "24/7 security incident response and management", icon: "fas fa-bell", color: "red" },
      { title: "Red Team Operations", url: "/services/red-team", description: "Advanced adversary simulation and testing", icon: "fas fa-user-secret", color: "purple" }
    ];
    
    // Filter pages based on search query
    const matchedPages = pages.filter(page => 
      page.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
      page.description.toLowerCase().includes(sanitizedQuery.toLowerCase())
    );
    
    const matchedServices = services.filter(service =>
      service.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(sanitizedQuery.toLowerCase())
    );
    
    // 11. Format results with HTML escaping
    const formattedCourses = courses.map(course => ({
      type: "course",
      title: escapeHtml(course.title),
      url: `/courses/${course._id}`,
      description: escapeHtml(course.shortDescription?.substring(0, 120)),
      image: course.image?.url || null,
      icon: "fas fa-graduation-cap",
      color: "blue",
      badge: escapeHtml(course.courceType || "Course"),
      price: course.price
    }));
    
    const formattedBlogs = blogs.map(blog => ({
      type: "blog",
      title: escapeHtml(blog.title),
      url: `/blogs/${blog.id || blog._id}`,
      description: escapeHtml(blog.shortdescription?.substring(0, 120)),
      image: blog.image?.url || null,
      icon: "fas fa-blog",
      color: "purple",
      badge: escapeHtml(blog.category || "Blog"),
      author: escapeHtml(blog.author?.name)
    }));
    
    const formattedPages = matchedPages.map(page => ({
      type: "page",
      title: escapeHtml(page.title),
      url: page.url,
      description: escapeHtml(page.description),
      image: null,
      icon: page.icon,
      color: page.color,
      badge: "Page"
    }));
    
    const formattedServices = matchedServices.map(service => ({
      type: "service",
      title: escapeHtml(service.title),
      url: service.url,
      description: escapeHtml(service.description),
      image: null,
      icon: service.icon,
      color: service.color,
      badge: "Service"
    }));
    
    // 12. Combine and limit results
    let results = [...formattedCourses, ...formattedBlogs, ...formattedPages, ...formattedServices];
    results = results.slice(0, 12);
    
    // 13. Return safe response
    res.json({ 
      results,
      total: results.length,
      query: sanitizedQuery
    });
    
  } catch (error) {
    console.error("Search error:", error);
    logSecurityEvent('SEARCH_ERROR', query, clientIp, { error: error.message });
    res.status(500).json({ 
      results: [], 
      error: "Search failed",
      message: "An internal error occurred"
    });
  }
});

// Optional: Add rate limiting middleware (uncomment if you have express-rate-limit installed)

const rateLimit = require('express-rate-limit');
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per window
  message: { 
    error: "Too Many Requests", 
    message: "Please try again later",
    results: [] 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
router.get("/api/search", searchLimiter, router);


module.exports = router;