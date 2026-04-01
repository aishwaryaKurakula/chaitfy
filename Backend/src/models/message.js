const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,  
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:function requiredReceiverId() {
            return !this.groupId;
        },
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Group",
        default:null,
    },
    text: {
        type: String,
        trim:true,
        maxlength:2000,
    },
    image: {
        type: String,
    },
    readAt: {
        type: Date,
        default: null,
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    requestStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "accepted",
    },
},
   {
   timestamps: true
   }

);
module.exports = mongoose.model("Message",messageSchema);
