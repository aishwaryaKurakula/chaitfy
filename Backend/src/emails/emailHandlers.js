const { sendEmail } = require("./sender");
const {
  createWelcomeEmailTemplate,
  createLoginAlertEmailTemplate,
} = require("./emailTemplates");

const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    await sendEmail({
      to: email,
      subject: "Welcome to Chatify!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    console.log("Welcome email sent successfully");
  } catch (error) {
    console.error("Error in sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};
const sendLoginAlertEmail = async (email, name, loginTime, clientURL) => {
  try {
    await sendEmail({
      to: email,
      subject: "New login to your Chatify account",
      html: createLoginAlertEmailTemplate(name, loginTime, clientURL),
    });

    console.log("Login alert email sent successfully");
  } catch (error) {
    console.error("Error in sending login alert email:", error);
    throw new Error("Failed to send login alert email");
  }
};

module.exports = {
  sendWelcomeEmail,
  sendLoginAlertEmail,
};




