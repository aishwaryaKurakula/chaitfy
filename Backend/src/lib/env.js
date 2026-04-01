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
  RESEND_API_KEY:process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL:process.env.RESEND_FROM_EMAIL,
  EMAIL_FROM:process.env.EMAIL_FROM,
  EMAIL_USER:process.env.EMAIL_USER,
  EMAIL_PASS:process.env.EMAIL_PASS,
  EMAIL_FROM_NAME:process.env.EMAIL_FROM_NAME,
  SMTP_HOST:process.env.SMTP_HOST,
  SMTP_PORT:process.env.SMTP_PORT,
  SMTP_USER:process.env.SMTP_USER,
  SMTP_PASS:process.env.SMTP_PASS,
  SMTP_FROM_EMAIL:process.env.SMTP_FROM_EMAIL,
  CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY:process.env.ARCJET_KEY,
  ARCJET_ENV:process.env.ARCJET_ENV,
  
  
}
// console.log(ENV.EMAIL_USER);
// console.log(ENV.EMAIL_PASS);
module.exports = ENV;
