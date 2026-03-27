const jwt = require('jsonwebtoken')
const ENV = require('./env.js');
 const generateToken = (userId,res) => {
    const { JWT_SECRET }=ENV;
    if(!JWT_SECRET){
        throw new Error("JWT_SECRET is not configured")
    }
    const token = jwt.sign({ userId },ENV.JWT_SECRET,{
        expiresIn:"7d",
    });

    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        sameSite:"lax",
        // secure:ENV.NODE_ENV === "development" ? false :true,
        secure:false
    });
    return token;
}

module.exports = generateToken;