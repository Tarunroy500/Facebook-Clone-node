const mongoose = require("mongoose");

const otpModel = mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  email: String,
  password: String,
  firstname: String,
  lastname: String,
  birthdate: String,
  gender: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

module.exports = mongoose.model("Otp", otpModel);
