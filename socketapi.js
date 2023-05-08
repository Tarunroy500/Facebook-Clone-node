const io = require("socket.io")();
const Chat = require("./routes/chatModel")
const User = require("./routes/users")
const socketapi = {
    io: io
};
var usp = io.of("/user-namespace");
usp.on('connection', async function (socket) {
  console.log("User Connected");
  console.log(socket.handshake.auth.token);
  var userId = socket.handshake.auth.token;
  await User.findByIdAndUpdate({_id: userId},{$set:{is_online:'1'}})

  socket.broadcast.emit('getOnlineUser',{user_id:userId})

  socket.on('disconnect', async function () {
    console.log("user Disconnected");

    var userId = socket.handshake.auth.token;
  await User.findByIdAndUpdate({_id: userId},{$set:{is_online:'0'}})

  socket.broadcast.emit('getOfflineUser',{user_id:userId})

  });

  socket.on('newChat',function(data){
    socket.broadcast.emit('loadNewChat',data)
  })

  socket.on('existsChat',async function(data){
    var chats = await Chat.find({$or:[
        {sender_id:data.sender_id,receiver_id:data.receiver_id},
        {sender_id:data.receiver_id,receiver_id:data.sender_id},
    ]})
    console.log(chats);
    socket.emit('loadChats',{chats:chats});
  })
  socket.on('newGroupChat',function(data){
    socket.broadcast.emit('loadNewGroupChat',data)
  })
});
module.exports = socketapi;