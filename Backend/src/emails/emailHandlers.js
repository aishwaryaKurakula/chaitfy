const transporter = require("./sender"); // Gmail transporter
const createWelcomeEmailTemplate = require("./emailTemplates");
const ENV = require("../lib/env.js");

const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    const html = createWelcomeEmailTemplate(name, clientURL);

    await transporter.sendMail({
      from: `"Chatify Team" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Chatify!",
      // html: html,
      html:createWelcomeEmailTemplate(name, clientURL),
    });

    console.log("Welcome email sent successfully");
  } catch (error) {
    console.error("Error in sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};
console.log(ENV.EMAIL_USER);
console.log(ENV.EMAIL_PASS);
module.exports = sendWelcomeEmail;


















