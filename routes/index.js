var express = require("express");
const axios = require("axios");
var router = express.Router();
const otpModel = require("./otp");
const userModel = require("./users");
const postModel = require("./post");
const Chat = require("./chatModel");
const Group = require("./groupModel");
const GroupChat = require("./groupChatModel");

const Member = require("./memberModel");
const expressSession = require('express-session');

const commentModel = require("./comment");
const passport = require("passport");
const localStrategy = require("passport-local");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const url = "mongodb://localhost/fbclone";
// const conn = mongodb.connect(url, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// let bucket;
// conn.once("open", () => {
//   bucket = new mongodb.GridFSBucket(conn.db, {
//     bucketName: "File",
//   });
// });
const multer = require("multer");
const User = require("./users");
passport.use(
  new localStrategy(
    { usernameField: "email", passwordField: "password" },
    userModel.authenticate()
  )
);

// const storage = new GridFsStorage({
//   url,
//   options: { useNewUrlParser: true, useUnifiedTopology: true },
//   file: (req, file) => {
//     return {
//       bucketName: "File",
//       filename: `${Date.now()}-fbclone-${file.originalname}`,
//     };
//   },
// });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + file.originalname);
  },
});
const upload = multer({ storage });

/* GET home page. */
// Login Page
router.get("/", checkLoggedIn, function (req, res, next) {
  res.render("login");
});
// Identify Page
router.post("/load-group-chats", isLoggedIn,async function (req, res, next) {
  const groupChats=await GroupChat.find({group_id:req.body.group_id}).populate('sender_id')
  res.send({success:true,chats:groupChats})

});
router.post("/group-save-chat", isLoggedIn, async function (req, res, next) {
  var chat=new GroupChat({
    sender_id:req.body.sender_id,
    group_id:req.body.group_id,
    message:req.body.message
  })
  var newChat=await chat.save();
  var cChat=await GroupChat.findOne({_id:newChat._id}).populate('sender_id')
  res.send({success:true,chat:cChat})
});
router.get("/group-chat", isLoggedIn, async function (req, res, next) {
  const myGroups =await Group.find({creator_id:req.user._id})
  const joinedGroups = await Member.find({user_id:req.user._id}).populate('group_id')
  res.render("chat-group",{myGroups:myGroups,joinedGroups:joinedGroups,user:req.user,user:req.user});
});
router.get("/identify", function (req, res, next) {
  res.render("identify");
});
// Signup Page
router.get("/group",isLoggedIn, async function (req, res, next) {
  const groups =await Group.find({creator_id:req.user._id})
  res.render("group",{groups:groups});
});
router.get("/mess", function (req, res, next) {
  res.render("mess");
});
// SinglePost Page
router.get("/singlepost/:id", async (req, res, next) => {
  const user = await userModel.findOne({ _id: req?.user?._id });
  const post = await postModel.findOne({ _id: req.params.id }).populate([
    {
      path: "author",
      model: "User",
    },
    {
      path: "comments",
      model: "Comment",
      populate: {
        path: "author",
        model: "User",
      },
    },
  ]);
  if (post) {
    res.render("singlepost", { user: user && user, post: post });
  } else {
    res.redirect("/home");
  }
});
// saved post
router.get("/saved_posts/:id", async (req, res, next) => {
  const user = await userModel.findOne({ _id: req?.user?._id });
  if (user.bookmarks.includes(req.params.id)) {
    user.bookmarks.pull(req.params.id);
  } else {
    user.bookmarks.push(req.params.id);
  }
  await user.save();
  res.redirect("/home");
});
// all bookmarks
router.get("/bookmarks", async (req, res, next) => {
  const user = await userModel.findOne({ _id: req?.user?._id });
  const posts = await postModel
    .find({ _id: { $in: user.bookmarks } })
    .populate("author");
  res.json({ posts, user });
});
// block user
router.get("/block/:id", async (req, res, next) => {
  const user = await userModel.findOne({ _id: req?.user?._id });
  const blockedUser = await userModel.findOne({ _id: req.params.id });
  if (user.blocked.includes(req.params.id)) {
    user.blocked.pull(req.params.id);
    blockedUser.reports.pull(req.user._id);
  } else {
    user.blocked.push(req.params.id);
    blockedUser.reports.push(req.user._id);
  }
  await user.save();
  await blockedUser.save();
  res.redirect("back");
});
router.post("/get-members",isLoggedIn, async function (req, res, next) {
  var users = await userModel.aggregate([
    {
      $lookup:{
        from:"members",
        localField:"_id",
        foreignField:"user_id",
        pipeline:[
          {
            $match:{
              $expr:{
                $and:[
                  {$eq:["$group_id",mongoose.Types.ObjectId(req.body.group_id)]}
                ]
              }
            }
          }
        ],
        as:"member"
      }
    },
    {
      $match:{
        "_id":{
          $nin:[mongoose.Types.ObjectId(req.user._id)]
        }
      }
    }
  ])
  // var users = await userModel.find({ _id: { $ne: req.user._id } });
  // var users=await User.find({_id:{$nin:[req.user._id]}})
  console.log(users);

  res.status(200).send({success:true,data:users})
});
router.post("/add-members",isLoggedIn, async function (req, res, next) {
  console.log(req.body.limit);
  // console.log(req.body.checkboxes);
  if(!req.body.members){
    res.status(200).send({success: false, msg: 'Please select any one Member' })
  }else if(req.body.members.length >  parseInt(req.body.limit)){
    res.status(200).send({success: false, msg: 'you cannot select more than'+req.body.limit+'Members' })
  }else{
    await Member.deleteMany({group_id:req.body.group_id})
    var data =[];
    const members =req.body.members;
    for(let i=0;i<members.length;i++){
      data.push({
        group_id:req.body.group_id,
        user_id:members[i]
      });
    }
    await Member.insertMany(data)
    res.status(200).send({success: true, msg: 'Members added Successfully' })

  }

});

router.get("/home", isLoggedIn, async (req, res, next) => {
  const posts = await postModel.find({}).populate("author");
  const user = await userModel
    .findOne({ _id: req.user._id })
    .populate("friends friend_requests_received");
  res.render("home", { user: user, posts: posts });
});
router.get("/settings", isLoggedIn, function (req, res, next) {
  res.render("settings", { user: req.user });
});
router.get("/reset/:phone", function (req, res, next) {
  res.render("reset", { phone: req.params.phone });
});
router.post("/otpPage", async function (req, res, next) {
  console.log(req.body);
  const { phone } = req.body;
  var otpSendUser = await userModel.findOne({ phone: phone });
  console.log(otpSendUser);
  if (otpSendUser) {
    res.json({ message: "success", user: otpSendUser });
  }
});
router.post("/reset/:phone", async function (req, res) {
  var user = await userModel.findOne({ phone: req.params.phone });
  if (user) {
    await user.setPassword(req.body.newpassword, async function (err, fuser) {
      res.redirect("/");
      if (err) console.log(err);
      else {
        await user.save();
      }
    });
  }
});
router.post("/signup", async (req, res, next) => {
  const { email, password, firstname, lastname, phone, birthdate, gender } =
    req.body;
  const user = await userModel.findOne({ email: email });
  if (user) {
    res.json({ message: "user already exists" });
  } else {
    try {
      const otpval = Math.floor(1000 + Math.random() * 9000);
      const message = "Your One Time Password (OTP) for online class is ";
      const apiKey = "I3gCHAhHJHCD9wBP&senderid=WSVTEC&";
      await axios.post(
        `http://msg.websoftvalley.com/V2/http-api.php?apikey=${apiKey}number=${phone}&message=${message}${otpval}.&format=json`
      );
      const otp = await otpModel.findOne({ phone: phone });
      if (otp) {
        await otpModel.findOneAndUpdate(
          { phone: phone },
          {
            otp: otpval,
            email: email,
            password: password,
            firstname: firstname,
            lastname: lastname,
            birthdate: birthdate,
            gender: gender,
          }
        );
      } else {
        await otpModel.create({
          phone: phone,
          otp: otpval,
          email: email,
          password: password,
          firstname: firstname,
          lastname: lastname,
          birthdate: birthdate,
          gender: gender,
        });
      }
      res.json({ message: "success", otp: "send otp" });
    } catch (error) {
      console.log(err);
      ``;
    }
  }
});
router.post("/sendotp", async (req, res, next) => {
  console.log(req.body);
  const { phone } = req.body;
  const user = await userModel.findOne({ phone: phone });
  if (user) {
    const otpval = Math.floor(1000 + Math.random() * 9000);
    const message = "Your One Time Password (OTP) for online class is ";
    const apiKey = "I3gCHAhHJHCD9wBP&senderid=WSVTEC&";
    axios.post(
      `http://msg.websoftvalley.com/V2/http-api.php?apikey=${apiKey}number=${phone}&message=${message}${otpval}.&format=json`
    );
    const otp = await otpModel.findOne({ phone: phone });
    if (otp) {
      await otpModel.findOneAndUpdate({ phone: phone }, { otp: otpval });
    } else {
      await otpModel.create({ phone: phone, otp: otpval });
      res.json({ message: "success", otp: "otp send", user: user });
    }
  }
});
// login
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "back",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);
router.post("/verifyotp", async (req, res, next) => {
  const { otp, phone } = req.body;
  const user = await otpModel.findOne({ otp: otp, phone: phone });
  if (user) {
    var newUser = new userModel({
      email: user.email,
      first_name: user.firstname,
      last_name: user.lastname,
      phone: user.phone,
      birthdate: user.birthdate,
      gender: user.gender,
    });
    userModel.register(newUser, user.password).then(function (u) {
      req.login(u, function (err) {
        if (err) {
          console.log(err);
        }
        res.json({ message: "success" });
      });
      // res.json({ message: "success" });
    });
  }
});
router.post("/verifyotpsubmit", async (req, res, next) => {
  const { phone, otp } = req.body;
  const user = await otpModel.findOne({ phone: phone });
  console.log("user -> ", user);
  if (user.otp == otp) {
    res.json({ message: "success", user: user });
  }
});
// profile
router.get("/profile/:id", isLoggedIn, async (req, res, next) => {
  const user = await userModel
    .findById(req.params.id)
    .populate("friends posts");
  const loggedInUser = await userModel.findById(req.user._id);
  res.render("profile", { user: user, loggedInUser: loggedInUser });
});

router.post("/updateprofile", isLoggedIn, async (req, res, next) => {
  const { firstname, lastname, email, phone } = req.body;
  const user = await userModel.findById(req.user._id);
  user.first_name = firstname;
  user.last_name = lastname;
  user.email = email;
  user.phone = phone;
  await user.save();
  res.redirect("/home");
});
// Like Post
router.get("/like/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id });
  if (post.likes.indexOf(req.user._id) === -1) {
    post.likes.push(req.user._id);
  } else {
    var index = post.likes.indexOf(req.user._id);
    post.likes.splice(index, 1);
  }
  await post.save();
  res.redirect(req.header("referer"));
});
// delete post
router.get("/deletepost/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  var index = user.posts.indexOf(req.params.id);
  user.posts.splice(index, 1);
  await user.save();
  await postModel.findByIdAndDelete(req.params.id);
  res.redirect(req.header("referer"));
});
// friend request
router.get("/friendrequest/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  const friend = await userModel.findOne({ _id: req.params.id });
  if (user.friend_requests_sent.indexOf(req.params.id) === -1) {
    user.friend_requests_sent.push(req.params.id);
    friend.friend_requests_received.push(req.user._id);
  } else {
    var index = user.friend_requests_sent.indexOf(req.params.id);
    user.friend_requests_sent.splice(index, 1);
    var index2 = friend.friend_requests_received.indexOf(req.user._id);
    friend.friend_requests_received.splice(index2, 1);
  }
  await user.save();
  await friend.save();
  res.redirect(req.header("referer"));
});
// acceptrequest
router.get("/acceptrequest/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  const friend = await userModel.findOne({ _id: req.params.id });
  if (user.friends.indexOf(req.params.id) === -1) {
    user.friends.push(req.params.id);
    friend.friends.push(req.user._id);
  }
  var index = user.friend_requests_received.indexOf(req.params.id);
  user.friend_requests_received.splice(index, 1);
  var index2 = friend.friend_requests_sent.indexOf(req.user._id);
  friend.friend_requests_sent.splice(index2, 1);
  await user.save();
  await friend.save();
  res.redirect(req.header("referer"));
});
// deleterequest
router.get("/deleterequest/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  const friend = await userModel.findOne({ _id: req.params.id });
  var index = user.friend_requests_received.indexOf(req.params.id);
  user.friend_requests_received.splice(index, 1);
  var index2 = friend.friend_requests_sent.indexOf(req.user._id);
  friend.friend_requests_sent.splice(index2, 1);
  await user.save();
  await friend.save();
  res.redirect(req.header("referer"));
});
// cancelrequest
router.get("/cancelrequest/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  const friend = await userModel.findOne({ _id: req.params.id });
  var index = user.friend_requests_sent.indexOf(req.params.id);
  user.friend_requests_sent.splice(index, 1);
  var index2 = friend.friend_requests_received.indexOf(req.user._id);
  friend.friend_requests_received.splice(index2, 1);
  await user.save();
  await friend.save();
  res.redirect(req.header("referer"));
});
// unfriend
router.get("/unfriend/:id", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ _id: req.user._id });
  const friend = await userModel.findOne({ _id: req.params.id });
  var index = user.friends.indexOf(req.params.id);
  user.friends.splice(index, 1);
  var index2 = friend.friends.indexOf(req.user._id);
  friend.friends.splice(index2, 1);
  await user.save();
  await friend.save();
  res.redirect(req.header("referer"));
});

// search user
router.get("/username/:first_name", isLoggedIn, async (req, res) => {
  const founduser = await userModel.find({
    first_name: { $regex: req.params.first_name, $options: "i" },
  });
  res.json({ founduser: founduser });
});
// single post
router.get("/post/:id", isLoggedIn, async (req, res) => {
  const post = await postModel
    .findById(req.params.id)
    // .populate("author comments.author");
    .populate({
      path: "comments",
      populate: {
        path: "author",
      },
    });

  res.json({ post: post, user: req.user });
});
// comment
router.post("/comment/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id);
  const { comment } = req.body;
  const cmt = await commentModel.create({
    author: req.user._id,
    comment: comment,
    post: req.params.id,
  });
  post.comments.push(cmt._id);
  await post.save();
  res.redirect(req.header("referer"));
});
// deletecomment
router.get("/deletecomment/:postid/:cmtid", isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.postid);
  var index = post.comments.indexOf(req.params.cmtid);
  post.comments.splice(index, 1);
  await post.save();
  await commentModel.findByIdAndDelete(req.params.cmtid);
  res.redirect(req.header("referer"));
});
// upload profile
router.post(
  "/uploadprofile",
  upload.single("profile_image"),
  isLoggedIn,
  async (req, res, next) => {
    const user = await userModel.findOne({ _id: req.user._id });
    user.profile_picture = `../uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: "success upload profile" });
  }
);
// upload cover
router.post(
  "/uploadcover",
  upload.single("cover_image"),
  isLoggedIn,
  async (req, res, next) => {
    const user = await userModel.findOne({ _id: req.user._id });
    user.cover_photo = `../uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: "success upload profile" });
  }
);
router.post("/group",upload.single("group"),isLoggedIn,async (req, res, next) => {

  const group = new Group({
    creator_id:req.user._id,
    name:req.body.name,
    image :'../uploads/'+req.file.filename,
    limit: req.body.limit,
  })
  await group.save();
  const groups =await Group.find({creator_id:req.user._id})

  res.render('group',{message:req.body.name+'Group Created Successfully',groups:groups})
  
});

router.get("/message", isLoggedIn, async function (req, res, next) {
  var users = await userModel.find({ _id: { $ne: req.user._id } });
  res.render("message", { user: req.user, users: users });
});
// upload post
router.post(
  "/uploadpost",
  upload.single("file"),
  isLoggedIn,
  async (req, res, next) => {
    try {
      const post = await postModel.create({
        author: req.user._id,
        title: req.body.title,
        file: `../uploads/${req?.file?.filename}`,
        filetype: req?.file?.mimetype.split("/")[0],
      });
      const user = await userModel.findById(req.user._id);
      user.posts.push(post._id);
      await user.save();
      res.redirect("/home");
    } catch (err) {
      res.send(new Error(err));
    }
  }
);
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
router.post("/save-edit", isLoggedIn, async function (req, res, next) {
  await userModel.findByIdAndUpdate(
    { _id: req.user._id },
    {
      went_to: req.body.went_to,
      degree: req.body.degree,
      field_of_study: req.body.field_of_study,
      lives_in: req.body.lives_in,
      from: req.body.from,
      website: req.body.website,
      birthdate: req.body.birthdate,
      gender: req.body.gender,
    }
  );
  const user = await userModel.findById(req.user._id);
  console.log(user);
  res.send({ message: "success", user: user });
});

router.post("/save-chat", async function (req, res, next) {
  var chat = new Chat({
    sender_id: req.body.sender_id,
    receiver_id: req.body.receiver_id,
    message: req.body.message,
  });
  var newChat = await chat.save();
  res.status(200).send({ success: true, msg: "Chat Inserted", data: newChat });
});
router.post("/update", isLoggedIn, async function (req, res, next) {
  var User = await userModel.findById({ _id: req.user._id });
  await userModel.findByIdAndUpdate(
    { _id: req.user._id },
    {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
    }
  );
  User.changePassword(req.body.oldpassword, req.body.newpassword, function () {
    res.redirect("home");
  });
});
router.get("/feeds/:page/:qantity", isLoggedIn, async (req, res, next) => {
  const page = req.params.page;
  const qantity = req.params.qantity;
  const posts = await postModel.find().populate("author");
  posts.sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  const skip = page * qantity;
  posts.splice(0, skip);
  posts.splice(qantity, posts.length);

  var user = await userModel.findById(req.user._id);
  res.json({ posts: posts, user: user });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.reports.length > 2) {
      req.logout(function (err) {
        if (err) {
          return next(err);
        }
        res.send({ message: "your account has been reported" });
      });
    } else {
      return next();
    }
  } else {
    res.redirect("/");
  }
}
function checkLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/home");
  } else {
    return next();
  }
}

module.exports = router;
