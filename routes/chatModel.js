const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'registeruser'
    },
    receiver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'registeruser'
    },
    message:{
        type:String,
        required:true
    }

},
{timestamps:true}
)
module.exports = mongoose.model('Chat',chatSchema)