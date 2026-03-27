const path = require("path");
const dotenv = require("dotenv");

// Load .env from Backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ENV ={
  PORT:process.env.PORT,
  MONGO_URI:process.env.MONGO_URI,
  JWT_SECRET:process.env.JWT_SECRET,
  NODE_ENV:process.env.NODE_ENV,
  CLIENT_URL:process.env.CLIENT_URL,
  EMAIL_USER:process.env.EMAIL_USER,
  EMAIL_PASS:process.env.EMAIL_PASS,
  EMAIL_FROM_NAME:process.env.EMAIL_FROM_NAME,
  CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY:process.env.ARCJET_KEY,
  ARCJET_ENV:process.env.ARCJET_ENV,
  
  
}
// console.log(ENV.EMAIL_USER);
// console.log(ENV.EMAIL_PASS);
module.exports = ENV;
