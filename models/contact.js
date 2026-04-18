const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contactSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
  },
  subject: {
    type: String,
    enum: [
      "General Inquiry",
      "Course Information",
      "Certification Support",
      "Security Services",
      "Corporate Training",
      "Technical Support",
      "Partnership Opportunities",
      "Service",
      "other",
    ],
    required: true,
  },

  message: {
    type: String,
  },
  msgDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isSeen: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Contact", contactSchema);
