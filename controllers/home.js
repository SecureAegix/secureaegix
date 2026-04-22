const User = require("../models/user");
const Servise = require("../models/services");
const Course = require("../models/cources");
const Blog = require("../models/blog");
const cloudinary = require("../Cloudconfig.js"); 
const { all } = require("axios");

module.exports.homePage = async (req, res, next) => {
  try {
    const totalUsers = (await User.find()).length;
    const totalInstructors = (await User.find({ role: "admin" })).length;
    const totalCources = (await Course.find()).length;

    // Fetch courses for homepage (addInHomePage = true)
    const homepageCourses = await Course.find({
      addInHomePage: true,
      isActive: true,
    })
      .populate("teacher", "name")
      .sort({ homepageOrder: 1, createdAt: -1 })
      .limit(6);

    const popularCourse = await Course.findOne({
      isPopular: true,
      isActive: true,
    }).populate("teacher");

    const blogs = await Blog.find()
      .populate("author")
      .sort({ createdAt: -1 })
      .limit(6);

    res.render("secureaegix/home.ejs", {
      totalUsers,
      totalInstructors,
      totalCources,
      homepageCourses, // Pass to template
      popularCourse,
      blogs,
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/login");
  }
};

// module.exports.index = async (req, res) => {
//   try {
//     const totalUsers = (await User.find()).length;
//     const totalInstructors = (await User.find({ role: "admin" })).length;
//     const totalCources = (await Course.find()).length;

//     // Get courses for homepage with new filters
//     const cources = await Course.find({
//       addInHomePage: true,
//       isActive: true
//     })
//       .populate("teacher")
//       .sort({ homepageOrder: 1, createdAt: -1 })
//       .limit(6);

//     const popularCourse = await Course.findOne({
//       isPopular: true,
//       isActive: true
//     }).populate("teacher");

//     // Get courses for navbar
//     const navbarCourses = await Course.find({
//       showInNavbar: true,
//       isActive: true
//     }).select("title navbarButtonText navbarButtonLink navbarButtonColor navbarButtonIcon");

//     const blogs = await Blog.find()
//       .populate("author")
//       .sort({ createdAt: -1 })
//       .limit(6);

//     res.render("secureaegix/home.ejs", {
//       totalUsers,
//       totalInstructors,
//       totalCources,
//       cources,
//       popularCourse,
//       blogs,
//       navbarCourses, // Pass to navbar
//     });
//   } catch (error) {
//     console.log(error);
//     req.flash("error", "Something went wrong!");
//     res.redirect("/login");
//   }
// };
module.exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const links = await Link.find({ user: req.user._id });

    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

    res.render("users/profile.ejs", {
      User: user,
      totalLinks,
      totalClicks,
      links,
    });
  } catch (err) {
    req.flash("error", "Unable to load profile");
    res.redirect("/");
  }
};

module.exports.about = (req, res) => {
  res.render("others/about.ejs");
};
module.exports.privacy = (req, res) => {
  res.render("others/privacy.ejs");
};
module.exports.terms = (req, res) => {
  res.render("others/terms.ejs");
};
module.exports.contact = (req, res) => {
  res.render("others/contact.ejs");
};

//courses
module.exports.allCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const level = req.query.level || "";
    const filter = req.query.filter || "all";

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (level && level !== "all") {
      query.courseLevel = level;
    }

    // Apply filters
    if (filter === "active") query.isActive = true;
    else if (filter === "inactive") query.isActive = false;
    else if (filter === "popular") query.isPopular = true;
    else if (filter === "navbar") query.showInNavbar = true;
    else if (filter === "homepage") query.showInHomepage = true;

    const totalCourses = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate("teacher", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("secureaegix/courses.ejs", {
      cources: courses,
      currentPage: page,
      totalPages: Math.ceil(totalCourses / limit),
      totalCourses,
      search,
      level,
      filter,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/login");
  }
};

module.exports.renderNewCourseForm = async (req, res) => {
  // Get all teachers (users with role 'teacher' or 'admin' who can teach)
  const teachers = await User.find({ 
    role: { $in: ["admin", "teacher"] } 
  }).select("name email");
  
  res.render("secureaegix/newcourse.ejs", { 
    course: {}, 
    teachers: teachers || [] 
  });
};

module.exports.createNewCourse = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      description,
      price,
      actualPrice,
      courceType,
      duration,
      lounchedDate,
      courseLevel,
      addInHomePage,
      isPopular,
      isActive,
      showInNavbar,
      navbarButtonText,
      navbarButtonColor,
      teacher  // Add this line
    } = req.body;

    // Validate teacher selection
    if (!teacher) {
      req.flash("error", "Please select a teacher for this course");
      return res.redirect("/courses/new");
    }

    // Verify teacher exists
    const teacherExists = await User.findById(teacher);
    if (!teacherExists || (teacherExists.role !== "admin" && teacherExists.role !== "teacher")) {
      req.flash("error", "Selected teacher is not valid");
      return res.redirect("/courses/new");
    }

    // Create new course object
    const newCourse = new Course({
      teacher: teacher,  // Use selected teacher instead of req.user._id
      title,
      shortDescription,
      discription: description,
      price: Number(price),
      actualPrice: Number(actualPrice),
      courceType,
      duration: duration ? Number(duration) : undefined,
      lounchedDate: lounchedDate ? new Date(lounchedDate) : undefined,
      courseLevel: courseLevel || "beginner",
      addInHomePage: addInHomePage === "on",
      isPopular: isPopular === "on",
      isActive: isActive === "on",
      showInNavbar: showInNavbar === "on",
      navbarButtonText: navbarButtonText || "",
      navbarButtonColor: navbarButtonColor || "blue",
      students: [],
    });

    // Handle image upload
    if (req.file) {
      newCourse.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newCourse.save();

    req.flash("success", "Course created successfully!");
    res.redirect("/courses");
  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/courses/new");
  }
};

// Render Edit Course Form
module.exports.renderEditCourseForm = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      req.flash("error", "Course not found");
      return res.redirect("/courses");
    }
    
    // Get all teachers for dropdown
    const teachers = await User.find({ 
      role: { $in: ["admin", "teacher"] } 
    }).select("name email");
    
    res.render("secureaegix/editcourse.ejs", { 
      course,
      teachers: teachers || []
    });
  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/courses");
  }
};

// Handle Edit Course Submission
module.exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseData = req.body;

    // Handle checkboxes
    courseData.isActive = courseData.isActive === "on";
    courseData.isPopular = courseData.isPopular === "on";
    courseData.addInHomePage = courseData.addInHomePage === "on";
    courseData.showInNavbar = courseData.showInNavbar === "on";

    // Handle arrays
    if (courseData.prerequisites) {
      courseData.prerequisites = courseData.prerequisites
        .split(",")
        .map((p) => p.trim());
    }
    if (courseData.learningOutcomes) {
      courseData.learningOutcomes = courseData.learningOutcomes
        .split(",")
        .map((o) => o.trim());
    }
    if (courseData.includes) {
      courseData.includes = courseData.includes.split(",").map((i) => i.trim());
    }

    // Validate teacher if provided
    if (courseData.teacher) {
      const teacherExists = await User.findById(courseData.teacher);
      if (!teacherExists || (teacherExists.role !== "admin" && teacherExists.role !== "teacher")) {
        req.flash("error", "Selected teacher is not valid");
        return res.redirect(`/courses/${id}/edit`);
      }
    }

    if (req.file) {
      // Delete old image if exists
      const oldCourse = await Course.findById(id);
      if (oldCourse.image && oldCourse.image.filename) {
        await cloudinary.uploader.destroy(oldCourse.image.filename);
      }
      courseData.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await Course.findByIdAndUpdate(id, courseData, { new: true });

    req.flash("success", "Course updated successfully");
    res.redirect("/courses");
  } catch (error) {
    console.log(error);
    req.flash("error", "Could not update course");
    res.redirect("/courses");
  }
};

// Toggle Popular
module.exports.togglePopular = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.isPopular = !course.isPopular;
    await course.save();

    res.json({
      success: true,
      isPopular: course.isPopular,
      message: `Course ${course.isPopular ? "marked as" : "removed from"} popular`,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update popular status" });
  }
};

// Delete Course
module.exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      req.flash("error", "Course not found");
      return res.redirect("/courses");
    }

    req.flash("success", `Course "${course.title}" deleted successfully`);
    res.redirect("/courses");
  } catch (error) {
    console.log(error);
    req.flash("error", "Could not delete course");
    res.redirect("/courses");
  }
};

// Toggle Active (PATCH)
module.exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.json({
      success: true,
      isActive: course.isActive,
      message: `Course ${course.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update active status" });
  }
};

module.exports.toggleNavbarVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.showInNavbar = !course.showInNavbar;
    await course.save();

    res.json({
      success: true,
      showInNavbar: course.showInNavbar,
      message: `Course ${course.showInNavbar ? "added to" : "removed from"} navbar`,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update navbar visibility" });
  }
};

module.exports.toggleHomepageVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.showInHomepage = !course.showInHomepage;
    await course.save();

    res.json({
      success: true,
      showInHomepage: course.showInHomepage,
      message: `Course ${course.showInHomepage ? "added to" : "removed from"} homepage`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update homepage visibility",
    });
  }
};

module.exports.enrollCourseForm = async (req, res) => {
  try {
    const courses = await Course.find();
    res.render("secureaegix/enroll.ejs", { courses });
  } catch (error) {
    console.log(error);
    req.flash("error", "Please try again");
    res.redirect("/");
  }
};

module.exports.enrollInNewCource = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { description, paidPrice } = req.body;

    // User must be logged in
    if (!req.user) {
      req.flash("error", "Please login to enroll in a course");
      return res.redirect("/login");
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found. Please login again.");
      return res.redirect("/login");
    }

    // Check if user is blocked
    if (user.isBlocked) {
      req.flash(
        "error",
        "Your account has been blocked. Please contact support.",
      );
      return res.redirect("/contact");
    }

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      req.flash("error", "Course not found");
      return res.redirect("/enroll");
    }

    // Check if course is active
    if (!course.isActive) {
      req.flash("error", "This course is currently unavailable");
      return res.redirect("/enroll");
    }

    // Check already enrolled
    const alreadyEnrolled = course.students.some(
      (student) => student.user.toString() === user._id.toString(),
    );

    if (alreadyEnrolled) {
      req.flash("error", "You are already enrolled in this course");
      return res.redirect("/enroll");
    }

    // Add student to course
    course.students.push({
      user: user._id,
      paidPrice: paidPrice ? Number(paidPrice) : 0,
      description: description || "",
      enrolledAt: new Date(),
      isSeen: false,
    });

    await course.save();

    req.flash("success", `Successfully enrolled in "${course.title}"`);
    return res.redirect("/courses");
  } catch (error) {
    console.error("Enrollment error:", error);
    req.flash("error", "Enrollment failed. Please try again.");
    return res.redirect("/enroll");
  }
};

module.exports.enrollCourse = async (req, res) => {
  const redirectUrl = res.locals.redirectUrl || "/";
  try {
    const { courseId, paidPrice, name, email, mobile, description } = req.body;

    if (!courseId || !name || !email || !mobile) {
      req.flash("error", "Please fill all required fields");
      return res.redirect(redirectUrl);
    }

    const user = req.user;

    // 🔹 Update user mobile if not exists
    if (!user.mobile) {
      user.mobile = mobile;
      await user.save();
    }

    // 🔹 Find course
    const course = await Course.findById(courseId);

    if (!course) {
      req.flash("error", "Course not found");
      return res.redirect(redirectUrl);
    }

    // 🔹 Check already enrolled
    const alreadyEnrolled = course.students.some(
      (s) => s.user.toString() === user._id.toString(),
    );

    if (alreadyEnrolled) {
      req.flash("info", "You are already enrolled in this course");
      return res.redirect(redirectUrl);
    }

    // 🔹 Push student data
    course.students.push({
      user: user._id,
      paidPrice: Number(paidPrice),
      description: description || "",
      enrolledAt: new Date(),
      isSeen: false,
    });

    await course.save();

    req.flash("success", "Enrollment successful 🎉");
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again");
    return res.redirect(redirectUrl);
  }
};

module.exports.viewCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "name email mobile profileImage")
      .populate("students.user", "name email")
      .lean(); // Use lean() for better performance

    if (!course) {
      req.flash("error", "Course not found");
      return res.redirect("/courses");
    }

    // Get related courses (same category, excluding current course)
    const relatedCourses = await Course.find({
      courceType: course.courceType,
      _id: { $ne: course._id },
      isActive: true,
    })
      .limit(4)
      .select("title image price shortDescription courceType")
      .populate("teacher", "name")
      .lean();

    // Check if current user is enrolled (if user is logged in)
    let isEnrolled = false;
    let userEnrollment = null;

    if (req.user) {
      const enrollment = course.students?.find(
        (student) => student.user?._id?.toString() === req.user._id.toString(),
      );
      if (enrollment) {
        isEnrolled = true;
        userEnrollment = enrollment;
      }
    }

    // Calculate course statistics
    const totalStudents = course.students?.length || 0;
    const totalRevenue =
      course.students?.reduce(
        (sum, student) => sum + (student.paidPrice || 0),
        0,
      ) || 0;

    const dynamicMeta = {
      title: course.title + " | secureaegix Courses",
      description: course.shortDescription,
      keywords:
        course.courceType +
        ", " +
        course.title +
        ", " +
        course.shortDescription +
        ", " +
        course.teacher.name +
        " best cybersecurity course, Best academy for cybersecurity, " +
        course.courceType +
        " course online",
      image: course.image.url,
    };

    res.render("secureaegix/viewCourse.ejs", {
      meta: dynamicMeta,
      course,
      relatedCourses,
      isEnrolled,
      userEnrollment,
      totalStudents,
      totalRevenue,
      currentUser: req.user,
      pageTitle: course.title,
    });
  } catch (err) {
    console.error("Error viewing course:", err);
    req.flash("error", "Failed to load course details");
    res.redirect("/courses");
  }
};
