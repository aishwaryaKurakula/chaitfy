const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email:{
    type:String,
    required:true,
    unique:true,
    },
    username:{
type:String,
required:true,
    },
    password:{
        type:String,
        required:true,
        minlength:6,
    },
    profilePic:{
        type:String,
        default:""
    },
    acceptedContacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    lastSeen: {
        type: Date,
        default: null,
    },
},{timestamps:true}) //createdAt and UpdatedAt 
//last login

const User = mongoose.model("User",userSchema)

module.exports=User;
