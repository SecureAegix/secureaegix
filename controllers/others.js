const User = require("../models/user");
const Contact = require("../models/contact");
const Subscriber = require("../models/subscriber");
const { sendContactNotificationEmail } = require("../utils/contactNotificationEmail");

module.exports.contact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const mobile = req.body.mobile || req.body.phone;

    const contact = await Contact.create({
      user: req.user?._id,
      name,
      email,
      mobile,
      subject,
      message,
    });

    let notificationSent = true;
    try {
      await sendContactNotificationEmail(contact);
    } catch (emailError) {
      notificationSent = false;
      console.error("Contact saved, but the Brevo notification email failed:", emailError);
    }

    if (req.accepts("json")) {
      return res.status(201).json({
        success: true,
        message: notificationSent
          ? "Thanks for reaching out. Our team will contact you soon."
          : "Your message was received, but our email notification could not be sent. Our team can still view it in the admin panel.",
      });
    }

    req.flash(
      notificationSent ? "success" : "warning",
      notificationSent
        ? "Message sent successfully"
        : "Your message was saved, but the notification email could not be sent.",
    );
    res.redirect("/contact");
  } catch (error) {
    console.error("Contact form submission failed:", error);
    if (req.accepts("json")) {
      return res.status(500).json({
        success: false,
        message: "We couldn't send your details. Please try again.",
      });
    }
    req.flash("error", "Something went wrong!");
    res.redirect("/contact");
  }
};

module.exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if already subscribed
    const existingUser = await Subscriber.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already subscribed",
      });
    }

    // Save new subscriber
    await Subscriber.create({ email });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error) {
    console.error("Newsletter Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

module.exports.carriers = async (req, res) => {
  res.render("others/careers.ejs");
};
