const { boolean } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courcesSchema = new Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  students: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      enrolledAt: {
        type: Date,
        default: Date.now,
      },
      paidPrice: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
      },
      isSeen: {
        type: Boolean,
        default: false,
      },
    },
  ],
  image: {
    url: String,
    filename: String,
  },

  title: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  discription: {
    type: String,
  },
  tableOfContent: [
    {
      tile: {
        type: String,
      },
      duration: {
        type: Number,
      },
    },
  ],
  price: {
    type: Number,
    required: true,
  },

  actualPrice: {
    type: Number,
    required: true,
  },
  courceType: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
  },
  lounchedDate: {
    type: Date,
  },
  addInHomePage: {
    type: Boolean,
    default: false,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  showInNavbar: {
    type: Boolean,
    default: false,
  },
  navbarButtonText: {
    type: String,
    default: "",
    trim: true,
  },
  navbarButtonLink: {
    type: String,
    default: "",
    trim: true,
  },
  navbarButtonColor: {
    type: String,
    enum: ["blue", "cyan", "purple", "green", "red", "yellow"],
    default: "blue",
  },
  navbarButtonIcon: {
    type: String,
    default: "fa-arrow-right",
  },
  
  // For homepage sections
  showInHomepage: {
    type: Boolean,
    default: false,
  },
  homepageSection: {
    type: String,
    enum: ["hero", "featured", "popular", "new", "trending", "none"],
    default: "none",
  },
  homepageOrder: {
    type: Number,
    default: 0,
  },
  
  // Course metadata
  featuredImage: {
    url: String,
    filename: String,
  },
  courseLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
    default: "beginner",
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  prerequisites: [{
    type: String,
  }],
  learningOutcomes: [{
    type: String,
  }],
  includes: [{
    type: String,
  }],
  
  // SEO fields
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
});

module.exports = mongoose.model("Cources", courcesSchema);
