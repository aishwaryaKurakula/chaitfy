const aj = require('../lib/arcjet.js');
const isSpoofedBot = require('@arcjet/inspect').isSpoofedBot;


const arcjetProtection = async (req,res,next) => {
   if (process.env.NODE_ENV !== "production") {
    return next()
  }
try{
const decision = await aj.protect(req);
if(decision.isDenied()) {
if(decision.reason?.type === 'RATE_LIMIT') {
    return res.status(429).json({message:"Rate limit exceeded. Please try again later"})
}
 else if(decision.reason?.type === 'BOT') {
return res.status(403).json({message:"Bot access denied"})
} else {
return res.status(403).json({message:"Access denied by security policy"})
}
}
// check for spoof bots==>acts like humans but bots
 
if (decision.results.some(isSpoofedBot)) {
return res.status(403).json({error:"spoofed bot detected",message:"Malicious bot activity detected."})
}
next();
}catch(error){
    console.error("Error in arcjetProtection:",error)
    next();
}

}
module.exports = arcjetProtection;