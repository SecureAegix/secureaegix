const express = require("express");
const router = express.Router();
const Course = require("../models/cources");
const Blog = require("../models/blog");

// Search API endpoint
router.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const searchRegex = new RegExp(query, "i");
    
    // Search Courses (limit 4)
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
    .lean();

    // Search Blogs (limit 3)
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
    .lean();

    // Static Pages Results
    const pages = [
      { title: "About Us", url: "/about", description: "Learn about SecureAegix - Cybersecurity training platform", icon: "fas fa-info-circle", color: "green" },
      { title: "Contact Us", url: "/contact", description: "Get in touch with our support team", icon: "fas fa-envelope", color: "blue" },
      { title: "Careers", url: "/careers", description: "Join our team of cybersecurity experts", icon: "fas fa-briefcase", color: "purple" },
      { title: "Privacy Policy", url: "/privacy", description: "Read our privacy and data protection policy", icon: "fas fa-shield-alt", color: "indigo" },
      { title: "Terms & Conditions", url: "/terms", description: "Terms of service and usage guidelines", icon: "fas fa-file-contract", color: "gray" }
    ];

    // Services Pages
    const services = [
      { title: "Penetration Testing", url: "/services/penetration-testing", description: "Professional security testing to identify vulnerabilities", icon: "fas fa-bug", color: "blue" },
      { title: "Vulnerability Assessment", url: "/services/vulnerability-assessment", description: "Comprehensive security assessment and scanning", icon: "fas fa-search", color: "cyan" },
      { title: "Incident Response", url: "/services/incident-response", description: "24/7 security incident response and management", icon: "fas fa-bell", color: "red" },
      { title: "Red Team Operations", url: "/services/red-team", description: "Advanced adversary simulation and testing", icon: "fas fa-user-secret", color: "purple" }
    ];

    // Filter pages based on search query
    const matchedPages = pages.filter(page => 
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.description.toLowerCase().includes(query.toLowerCase())
    );

    const matchedServices = services.filter(service =>
      service.title.toLowerCase().includes(query.toLowerCase()) ||
      service.description.toLowerCase().includes(query.toLowerCase())
    );

    // Format results
    const formattedCourses = courses.map(course => ({
      type: "course",
      title: course.title,
      url: `/courses/${course._id}`,
      description: course.shortDescription?.substring(0, 120),
      image: course.image?.url || null,
      icon: "fas fa-graduation-cap",
      color: "blue",
      badge: course.courceType || "Course",
      price: course.price
    }));

    const formattedBlogs = blogs.map(blog => ({
      type: "blog",
      title: blog.title,
      url: `/blogs/${blog.id || blog._id}`,
      description: blog.shortdescription?.substring(0, 120),
      image: blog.image?.url || null,
      icon: "fas fa-blog",
      color: "purple",
      badge: blog.category || "Blog",
      author: blog.author?.name
    }));

    const formattedPages = matchedPages.map(page => ({
      type: "page",
      title: page.title,
      url: page.url,
      description: page.description,
      image: null,
      icon: page.icon,
      color: page.color,
      badge: "Page"
    }));

    const formattedServices = matchedServices.map(service => ({
      type: "service",
      title: service.title,
      url: service.url,
      description: service.description,
      image: null,
      icon: service.icon,
      color: service.color,
      badge: "Service"
    }));

    // Combine all results
    let results = [...formattedCourses, ...formattedBlogs, ...formattedPages, ...formattedServices];
    
    // Limit total results to 12
    results = results.slice(0, 12);

    res.json({ 
      results,
      total: results.length,
      query: query
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ results: [], error: "Search failed" });
  }
});

module.exports = router;