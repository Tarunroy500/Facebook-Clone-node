const mongoose = require("mongoose");

const plm = require("passport-local-mongoose");

const url = "mongodb://127.0.0.1:27017/fbclone";

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
require("./comment");

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: Number, required: true, unique: true },
  profile_picture: {
    type: String,
    default:
      "https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png",
  },
  cover_photo: {
    type: String,
    default:
      "https://scontent.fbho3-2.fna.fbcdn.net/v/t1.6435-9/83454883_107606184122263_1183080919578181632_n.png?_nc_cat=106&ccb=1-7&_nc_sid=e3f864&_nc_ohc=OJDm5GE_jKMAX-2VFBH&_nc_ht=scontent.fbho3-2.fna&oh=00_AfAxEOG6q7I1WzSmqzylJE7js2Bl-fsadsKBSRv3PUbPrQ&oe=64761AA7",
  },
  password: String,
  bio: String,
  website: String,
  location: String,
  birthdate: String,
  gender: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friend_requests_sent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friend_requests_received: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  is_online: {
    type: String,
    default: "0",
  },
  went_to: { default: "", type: String },
  degree: { default: "", type: String },
  field_of_study: { default: "", type: String },
  lives_in: { default: "", type: String },
  from: { default: "", type: String },
  website: { default: "", type: String },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

userSchema.plugin(plm, { usernameField: "email" });

const User = mongoose.model("User", userSchema);

module.exports = User;
