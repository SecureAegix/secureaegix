if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
// const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const crypto = require("crypto");
const passport = require("passport");
const brevo = require("@getbrevo/brevo");
const { welComeEmail } = require("./utils/sendWelcomeEmail");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const homeRouter = require("./routes/home.js");
const userRouter = require("./routes/user.js");
const resetRout = require("./routes/authRoutes.js");
const searchRoutes = require("./routes/search");
const chatRoutes = require("./routes/chat");
const user = require("./models/user.js");
const adminRouter = require("./routes/admin.js");
const othersRouter = require("./routes/others.js");
const blogRouter = require("./routes/blog.js");
const serviceRouter = require("./routes/service.js");
const sitemapRouter = require("./routes/sitemap.js");
const diplomaRouter = require("./routes/diploma.js");
const Diploma = require("./models/diploma.js");
const seoMeta = require("./utils/seoMeta.json");
const Cources = require("./models/cources.js");
const {
  globalLimiter,
} = require("./middleware/rateLimits.js");
const csrfProtection = require("./middleware/csrf.js");

const dbUrl = process.env.ATLUSDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.disable("x-powered-by");

const trustProxyHops =
  process.env.TRUST_PROXY_HOPS === undefined
    ? process.env.NODE_ENV === "production"
      ? 1
      : 0
    : Number(process.env.TRUST_PROXY_HOPS);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
}
app.set("trust proxy", trustProxyHops);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: process.env.NODE_ENV === "production" ? undefined : false,
  }),
);
app.use(express.static(path.join(__dirname, "/public")));
app.use(globalLimiter);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb", parameterLimit: 500 }));
app.use(methodOverride("_method"));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  // crypto: {
  //   secret: process.env.SECRET,
  // },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("error in mongo session store", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  name: "secureaegix.sid",
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
  if (
    req.is("multipart/form-data") &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate()),
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.DOMAIN + "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        if (!email) {
          return done(new Error("Google account did not provide an email address."), null);
        }
        const name = profile.displayName?.trim() || email.split("@")[0];
        const googlePhoto = profile.photos?.[0]?.value;
        const profileImage = googlePhoto?.startsWith("https://") ? googlePhoto : undefined;

        let existingUser = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (existingUser) {
          let changed = false;
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            changed = true;
          }
          if (!existingUser.name?.trim()) {
            existingUser.name = name;
            changed = true;
          }
          if (!existingUser.email) {
            existingUser.email = email;
            changed = true;
          }
          if (!existingUser.profileImage && profileImage) {
            existingUser.profileImage = profileImage;
            changed = true;
          }
          if (changed) await existingUser.save();
          return done(null, existingUser);
        }

        const username = email.split("@")[0];
        // Create new user
        let newUser = new User({
          name,
          email,
          profileImage,
          googleId: profile.id,
          isVerified: true,
          username,
          authMethod: "google",
        });

        await newUser.save();
        await welComeEmail({
          name: newUser.name,
          email: newUser.email,
        });
        return done(null, newUser);
      } catch (err) {
        console.error("Google OAuth Error:", err);
        return done(err, null);
      }
    },
  ),
);

app.use((req, res, next) => {
  const isHtmlRequest = req.get("accept")?.includes("text/html");
  res.locals.csrfToken =
    isHtmlRequest && req.csrfToken ? req.csrfToken() : "";
  res.locals.captchaSiteKey = process.env.CAPTCHA_SITE_KEY || "";
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.info = req.flash("info");
  res.locals.warning = req.flash("warning");
  res.locals.primary = req.flash("primary");
  res.locals.currUser = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.showsplash = false;
  next();
});

// Navbar Courses Middleware
app.use(async (req, res, next) => {
  try {
    const courses = await Cources.find({ isActive: true });

    if (courses && courses.length > 0) {
      const navbarCourses = courses.filter(
        (course) => course.showInNavbar === true,
      );

      const navbarItems = (navbarCourses || []).map((course) => ({
        id: course._id,
        name: course.navbarButtonText || course.title,
        color: course.navbarButtonColor || "blue",
        url: `/courses/${course._id}`,
      }));

      res.locals.navbarCourses = navbarItems;
      //console.log("Navbar Courses Middleware: Found courses for navbar", navbarItems);
    } else {
      // No courses found in database
      res.locals.navbarCourses = [];
    }
    next();
  } catch (error) {
    console.error("Navbar Courses Middleware Error:", error);
    // Always set empty array to avoid undefined errors in views
    res.locals.navbarCourses = [];
    next();
  }
});

app.use((req, res, next) => {
  let meta = seoMeta[req.path];

  if (!meta) {
    if (req.path.startsWith("/blogs")) meta = seoMeta["/blogs"];
    else if (req.path.startsWith("/courses")) meta = seoMeta["/courses"];
    else meta = seoMeta["/"];
  }

  const host = process.env.DOMAIN || req.get('host');
  const fullUrl = req.protocol + '://' + host + req.originalUrl;

  meta = Object.assign(
    {
      image: '/images/logo.png',
      canonical: fullUrl,
    },
    meta
  );

  res.locals.meta = meta;
  next();
});

app.use((req, res, next) => {
  const host = process.env.DOMAIN || req.get('host');
  res.locals.requestUrl = req.protocol + '://' + host + req.originalUrl;
  next();
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back to SecureAegix!");
    res.redirect("/");
  },
);

app.use("/", userRouter);
app.use("/", homeRouter);
app.use("/", searchRoutes);
app.use("/", chatRoutes);
app.use("/", resetRout);
app.use("/", othersRouter);
app.use("/", diplomaRouter);
app.use("/", sitemapRouter);
app.use("/blogs", blogRouter);
app.use("/services", serviceRouter);
app.use("/admin", adminRouter);

app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // agar response already sent ho, dobara send mat karo
  }
  if (err.code === "EBADCSRFTOKEN") {
    const message = "Your session expired or the request could not be verified. Please try again.";
    if (
      req.path.startsWith("/api/") ||
      req.is("application/json") ||
      req.xhr
    ) {
      return res.status(403).json({ success: false, message });
    }
    req.flash("error", message);
    const referer = req.get("referer");
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === req.get("host")) {
        return res.redirect(`${refererUrl.pathname}${refererUrl.search}`);
      }
    } catch {
      // Fall through to a safe local destination.
    }
    return res.redirect("/");
  }
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message, statusCode });
});

app.listen(3000, () => {
  console.log(`SecureAegix.com is working at ${3000}`);
});
