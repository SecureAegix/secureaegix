/**
 * Diploma Program Controller
 * Handles all diploma-related operations including enrollment, curriculum, and page rendering
 * Created: 2026-01-15
 */

const Diploma = require("../models/diploma");
const Course = require("../models/cources");
const Blog = require("../models/blog");

// ==================== PAGE RENDERING CONTROLLERS ====================

/**
 * Render Diploma Main Landing Page
 * Route: GET /diploma
 * Description: Displays complete information about the 1-Year Advanced Diploma program
 */
module.exports.diplomaPage = async (req, res) => {
    try {
        // Get statistics for dashboard display
        const enrollmentStats = await Diploma.getStatistics();
        
        // Get featured courses for cross-promotion
        const featuredCourses = await Course.find({ isActive: true, isTrending: true })
            .limit(3)
            .lean();
        
        // Get latest blogs related to cybersecurity
        const latestBlogs = await Blog.find({ blocked: false, isvalid: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        
        res.render("diploma/index", {
            title: "1-Year Advanced Diploma in Cybersecurity | SecureAegix",
            description: "India's most comprehensive cybersecurity program with 680+ hours of hands-on training, 80% practical labs, and 6-month internship.",
            enrollmentStats,
            featuredCourses,
            latestBlogs,
            currentYear: new Date().getFullYear(),
            batchStartDate: "January 15, 2026",
            batchEndDate: "January 14, 2027"
        });
    } catch (error) {
        console.error("Diploma page error:", error);
        req.flash("error", "Unable to load diploma page. Please try again.");
        res.redirect("/");
    }
};

/**
 * Render Curriculum Page
 * Route: GET /diploma/curriculum
 * Description: Displays complete syllabus with 12 modules and all topics
 */
module.exports.curriculumPage = async (req, res) => {
    try {
        // Module structure based on PDF
        const modules = [
            {
                level: 1,
                title: "Network Intelligence Foundations",
                hours: 60,
                focus: "Network Security",
                topics: [
                    "Introduction to Networking & Security Integration",
                    "Network Fundamentals & OSI/TCP-IP Models",
                    "Routing & Switching Protocols",
                    "Access Control & Security Mechanisms",
                    "IP Services & Network Automation",
                    "Advanced Routing Concepts (BGP, OSPF)",
                    "Network Monitoring & Troubleshooting",
                    "Intelligence-Enhanced Lab Sessions",
                    "Enterprise Network Design Project",
                    "Certification & Career Path Planning"
                ]
            },
            {
                level: 2,
                title: "Linux Operations Mastery",
                hours: 40,
                focus: "Linux Security",
                topics: [
                    "Virtualization Setup (VMware/VirtualBox)",
                    "RHEL 9.3 Deployment & Configuration",
                    "Command Line Foundation & Navigation",
                    "File System Management & Permissions",
                    "User & Group Administration",
                    "Process Monitoring & Service Control",
                    "SSH Hardening & Secure Remote Access",
                    "Log Analysis & Storage Management",
                    "Network Configuration & Firewall Rules",
                    "Package Management & System Updates",
                    "File System Access & Disk Management",
                    "Server Troubleshooting & Support Channels",
                    "Assessment Papers & Practical Evaluation"
                ]
            },
            {
                level: 3,
                title: "Python Security Automation",
                hours: 60,
                focus: "Python Programming",
                topics: [
                    "Python Introduction & Language Comparison",
                    "Variables, Data Types & Memory Management",
                    "Operators & Expression Evaluation",
                    "Conditional Logic & Decision Making",
                    "Looping Constructs & Iteration Patterns",
                    "Control Flow & Exception Handling",
                    "Type Casting & Data Conversion",
                    "Number Manipulation & Mathematical Operations",
                    "String Operations & Pattern Matching",
                    "List Management & Sequence Handling",
                    "Tuple Structures & Immutable Collections",
                    "Dictionary Mapping & Key-Value Operations",
                    "Array Processing & Matrix Operations",
                    "Date/Time Manipulation & Scheduling",
                    "File I/O Handling & Data Persistence",
                    "Multithreading & Concurrent Execution",
                    "Mail Automation & Notification Systems",
                    "Database Connectivity (SQLite/MySQL)",
                    "OOP Concepts & Design Patterns",
                    "Network Programming & Socket Communication",
                    "GUI Development with Tkinter",
                    "Web Scraping & Data Extraction",
                    "Image Processing & Computer Vision Basics",
                    "Data Science Fundamentals (NumPy/Pandas)"
                ]
            },
            {
                level: 4,
                title: "Offensive Security Essentials",
                hours: 60,
                focus: "Ethical Hacking",
                topics: [
                    "Strike Operations Fundamentals & Legal Framework",
                    "Intelligent Assistants (ShellGPT, TerminalGPT, ChatGPT)",
                    "Prompt Engineering for Security Payloads",
                    "Active Footprinting via Automated Scripts",
                    "Passive Footprinting & OSINT Automation",
                    "Advanced Nmap with Script Generation",
                    "User Enumeration & Service Discovery",
                    "System Compromise & Password Bypass Techniques",
                    "Assisted Virus & Worm Development",
                    "Trojan Engineering & Backdoor Deployment",
                    "Bot & Botnet Architecture Design",
                    "MITM Operations with Kali Linux",
                    "MITM Operations on Windows Platforms",
                    "Social Engineering Theory & Psychology",
                    "SET Toolkit with Enhancement",
                    "DoS & DDoS Attack Methodologies",
                    "Web Session Hijacking & Cookie Theft",
                    "Manual SQL Injection with Assistance",
                    "Automated SQL Injection (SQLMap Integration)",
                    "Web Application Security Fundamentals",
                    "Web Server Compromise via TerminalGPT",
                    "Wireless Hacking - CLI Based Techniques",
                    "Advanced Wireless Network Attacks",
                    "IDS/Firewall Evasion with Camouflage",
                    "Honeypot Deployment & Detection",
                    "Buffer Overflow Fundamentals",
                    "Cryptography with Analysis Tools",
                    "Penetration Testing Methodology",
                    "Mobile Payload Generation",
                    "IoT Device Compromise Techniques",
                    "Cloud Security & Misconfiguration Exploitation"
                ]
            },
            {
                level: 5,
                title: "Advanced Penetration Operations",
                hours: 60,
                focus: "Red Teaming",
                topics: [
                    "Breach Protocol Introduction & Scope Definition",
                    "Supercharged Scanning with Systems",
                    "Exploitation Tactics & Custom Payloads",
                    "CLI Adventures with Assistants",
                    "Kali Linux Mastery & Custom Toolsets",
                    "Bash Scripting with Automation",
                    "Powered Practical Security Tools",
                    "Active Intelligence Gathering Techniques",
                    "Passive Intelligence & Dark Web Analysis",
                    "Buffer Overflow Fundamentals",
                    "Advanced Buffer Overflow & Shellcode",
                    "Exploit Engineering & Fix Automation",
                    "Public Exploit Hunting & Validation",
                    "Antivirus Evasion with Camouflage",
                    "Seamless File Transfer & Exfiltration",
                    "Windows Privilege Escalation Techniques",
                    "Linux Privilege Escalation Tactics",
                    "Password Cracking with Optimization",
                    "Port Redirection & Tunneling Methods",
                    "Active Directory Attacks & Lateral Movement",
                    "PowerShell Empire & Post-Exploitation",
                    "Real-World Challenge Labs (CTF Style)",
                    "Breach Test Breakdown & Analysis",
                    "Professional Report Crafting & CVSS Scoring"
                ]
            },
            {
                level: 6,
                title: "Digital Forensics & Investigation",
                hours: 60,
                focus: "Evidence Analysis",
                topics: [
                    "Forensics in Modern Digital Context",
                    "Investigation Process & Chain of Custody",
                    "Hard Disks & File System Architecture",
                    "Data Acquisition & Bit-Stream Duplication",
                    "Anti-Forensics Countermeasures",
                    "Windows Forensics (Registry, Event Logs, MFT)",
                    "Linux & Mac Forensics",
                    "Network Forensics & Packet Analysis",
                    "Web Forensics & Browser Artifacts",
                    "Dark Web Investigation Techniques",
                    "Cloud Forensics (AWS/Azure Logs)",
                    "Email Crime Investigation & Header Analysis",
                    "Malware Forensics & Behavioral Analysis",
                    "Mobile Forensics (Android/iOS Extraction)",
                    "IoT Forensics & Sensor Data Recovery"
                ]
            },
            {
                level: 7,
                title: "Web Application Security Mastery",
                hours: 40,
                focus: "Bug Bounty",
                topics: [
                    "Introduction to Web Security Landscape",
                    "OWASP Top 10 & Top 25 Deep Dive",
                    "Reconnaissance for Bug Hunting",
                    "Advanced SQL Injection Techniques",
                    "Command Injection & OS Command Execution",
                    "Session Management & Broken Authentication",
                    "Cross-Site Request Forgery (CSRF)",
                    "Server-Side Request Forgery (SSRF)",
                    "Cross-Site Scripting (XSS) with Detection",
                    "Insecure Direct Object Reference (IDOR)",
                    "Sensitive Data Exposure & Information Disclosure",
                    "Server-Side Template Injection (SSTI)",
                    "Multi-Factor Authentication Bypass",
                    "HTTP Request Smuggling",
                    "External File Path Manipulation",
                    "Local & Remote File Inclusion (LFI/RFI)",
                    "Directory Path Traversal",
                    "HTML Injection & Client-Side Attacks",
                    "Host Header Injection & Cache Poisoning",
                    "File Upload Vulnerabilities & Web Shells",
                    "JWT Token Attacks & Algorithm Confusion",
                    "Web Application Flooding & Stress Testing",
                    "API Security Testing (REST/GraphQL)",
                    "Professional Report Writing & Disclosure"
                ]
            },
            {
                level: 8,
                title: "Mobile Application Security",
                hours: 60,
                focus: "Android/iOS Security",
                topics: [
                    "Mobile Penetration Testing Introduction",
                    "Lab Environment Setup & Configuration",
                    "Android Architecture & Component Model",
                    "APK Structure & Manifest Analysis",
                    "Reverse Engineering with Apktool",
                    "Reverse Engineering with MobSF",
                    "Static Analysis & SAST Integration",
                    "Drozer Vulnerability Scanning",
                    "Improper Platform Usage Detection",
                    "Insecure Data Storage Analysis",
                    "Insecure Communication Channels",
                    "Insecure Authentication Mechanisms",
                    "Insufficient Cryptography Implementation",
                    "Insecure Authorization Controls",
                    "Client Code Quality Assessment",
                    "Code Tampering & Repackaging",
                    "Advanced Reverse Engineering Techniques",
                    "Extraneous Functionality Detection",
                    "SSL Pinning Bypass Methods",
                    "Network Traffic Interception (Burp/Frida)",
                    "Dynamic Analysis & Runtime Manipulation",
                    "Report Preparation with Assistance",
                    "iOS Penetration Testing Basics",
                    "Professional Report Writing"
                ]
            },
            {
                level: 9,
                title: "IoT & Embedded Security",
                hours: 60,
                focus: "Connected Devices",
                topics: [
                    "IoT Landscape & Security Importance",
                    "Tool Automation for IoT Scanning",
                    "IoT Architecture & Communication Models",
                    "Sensor Networks & Data Flow",
                    "Wireless Protocols (Zigbee, Z-Wave, BLE)",
                    "Hardware Protocols (SPI, UART, I2C)",
                    "Arduino Programming & Security",
                    "Raspberry Pi Deployment & Hardening",
                    "Mobile App Platform Integration",
                    "Flipper Zero & RF Analysis",
                    "Firmware Extraction & Analysis",
                    "Hardware Analysis & JTAG Debugging",
                    "SDR (Software Defined Radio) Basics",
                    "IoT Product Design & Security by Design",
                    "Cloud IoT Integration (IaaS/PaaS/SaaS)",
                    "Assisted Anomaly Detection"
                ]
            },
            {
                level: 10,
                title: "Endpoint Defense & Monitoring",
                hours: 60,
                focus: "EDR, SIEM",
                topics: [
                    "Internet Security Implementation",
                    "Multi-Factor Authentication Deployment",
                    "Mobile Device Management (MDM)",
                    "Data Loss Prevention (DLP) Strategies",
                    "SIEM with Correlation Engine",
                    "APT Attack Detection & Response",
                    "MITRE ATT&CK Framework Mapping",
                    "EDR & XDR Integration",
                    "Unified Threat Management (UTM)",
                    "Fortified Firewall Architecture",
                    "ISO 27001 Compliance & Enhancement"
                ]
            },
            {
                level: 11,
                title: "Cloud Infrastructure Security",
                hours: 60,
                focus: "AWS Cloud",
                topics: [
                    "High Availability & Cost-Effective Design",
                    "Hybrid IT Architectures",
                    "Monitoring & Logging Strategies",
                    "Elasticity & Scalability Patterns",
                    "EC2 Implementation with Optimization",
                    "S3 Management & Storage Classes",
                    "CloudFormation & Infrastructure as Code",
                    "VPS Understanding & Deployment",
                    "IAM Configuration with Assistance",
                    "VPC Design & Network Segmentation",
                    "CloudWatch Log Analysis",
                    "Route 53 & DNS Management",
                    "Storage Gateway & Disaster Recovery",
                    "Import/Export & Data Migration",
                    "Troubleshooting & Performance Optimization"
                ]
            },
            {
                level: 12,
                title: "Advanced AWS Security",
                hours: 60,
                focus: "Cloud Security",
                topics: [
                    "AWS Security Overview & Shared Responsibility",
                    "IAM with Log Querying & Analysis",
                    "VPC Monitoring & Optimization",
                    "Data Security (Encryption at Rest/Transit)",
                    "Server Security & Hardening",
                    "Edge Security (WAF, Shield, DDoS)",
                    "Assisted Threat Monitoring",
                    "Logging & Auditing Best Practices",
                    "Compliance Framework Integration",
                    "Security Hub & GuardDuty Configuration"
                ]
            }
        ];

        res.render("diploma/curriculum", {
            title: "Curriculum - 1-Year Diploma in Cybersecurity | SecureAegix",
            description: "Complete curriculum with 12 specialized modules, 680+ hours of training in cybersecurity.",
            modules,
            totalHours: 680,
            totalModules: 12
        });
    } catch (error) {
        console.error("Curriculum page error:", error);
        req.flash("error", "Unable to load curriculum page.");
        res.redirect("/diploma");
    }
};

/**
 * Render Enrollment Page
 * Route: GET /diploma/enroll
 * Description: Displays enrollment form for the diploma program
 */
module.exports.enrollPage = async (req, res) => {
    try {
        // If user is logged in, pre-fill form with their data
        let userData = {};
        if (req.user) {
            userData = {
                fullName: req.user.name,
                email: req.user.email,
                phone: req.user.phone || "",
                city: req.user.city || ""
            };
        }

        res.render("diploma/enroll", {
            title: "Enroll Now - 1-Year Diploma in Cybersecurity | SecureAegix",
            description: "Apply for our comprehensive cybersecurity diploma program. Limited seats available.",
            userData,
            batchStartDate: "January 15, 2026",
            programFee: 85000,
            originalFee: 125000
        });
    } catch (error) {
        console.error("Enrollment page error:", error);
        req.flash("error", "Unable to load enrollment page.");
        res.redirect("/diploma");
    }
};

// ==================== API CONTROLLERS ====================

/**
 * Submit Enrollment Application
 * Route: POST /api/diploma/enroll
 * Description: Saves enrollment form data to database
 */
module.exports.submitEnrollment = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            city,
            qualification,
            mode,
            batch,
            message
        } = req.body;

        // Validation
        const validationErrors = [];

        if (!fullName || fullName.length < 3) {
            validationErrors.push("Full name must be at least 3 characters");
        }

        if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            validationErrors.push("Please enter a valid email address");
        }

        if (!phone || !/^[0-9]{10}$/.test(phone)) {
            validationErrors.push("Please enter a valid 10-digit phone number");
        }

        if (!city || city.length < 2) {
            validationErrors.push("Please enter a valid city name");
        }

        if (!qualification) {
            validationErrors.push("Please select your highest qualification");
        }

        if (!mode) {
            validationErrors.push("Please select preferred mode of learning");
        }

        if (!batch) {
            validationErrors.push("Please select preferred batch");
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(", ")
            });
        }

        // Check for duplicate application (same email)
        const existingApplication = await Diploma.findOne({ email: email.toLowerCase() });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: "You have already applied. Our team will contact you soon."
            });
        }

        // Create new enrollment
        const enrollment = new Diploma({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            city: city.trim(),
            qualification,
            preferredMode: mode,
            preferredBatch: batch,
            message: message ? message.trim() : "",
            program: "Advanced Diploma in Cybersecurity & Intelligent Defense Systems",
            status: "pending"
        });

        await enrollment.save();

        // Optional: Send email notification (implement if email service is configured)
        // await sendEnrollmentConfirmationEmail(enrollment);

        console.log(`New enrollment received: ${fullName} (${email})`);

        res.json({
            success: true,
            message: "Application submitted successfully! Our team will contact you within 24 hours."
        });

    } catch (error) {
        console.error("Enrollment submission error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again or contact support."
        });
    }
};

/**
 * Get Enrollment Statistics (Admin Only)
 * Route: GET /api/diploma/stats
 * Description: Returns enrollment statistics for admin dashboard
 */
module.exports.getEnrollmentStats = async (req, res) => {
    try {
        // Check admin access
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const stats = await Diploma.getStatistics();
        
        // Get recent enrollments
        const recentEnrollments = await Diploma.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            stats: stats[0] || { total: 0, stats: [] },
            recentEnrollments
        });

    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch statistics"
        });
    }
};

/**
 * Update Enrollment Status (Admin Only)
 * Route: PUT /api/diploma/enrollment/:id
 * Description: Updates status of an enrollment application
 */
module.exports.updateEnrollmentStatus = async (req, res) => {
    try {
        // Check admin access
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const { id } = req.params;
        const { status, adminNotes } = req.body;

        if (!["pending", "contacted", "enrolled", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const enrollment = await Diploma.findById(id);
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        await enrollment.updateStatus(status, req.user.name);
        
        if (adminNotes) {
            enrollment.adminNotes = adminNotes;
            await enrollment.save();
        }

        res.json({
            success: true,
            message: `Enrollment status updated to ${status}`,
            enrollment
        });

    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update status"
        });
    }
};