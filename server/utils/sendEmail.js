const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generatePlainTextFromHtml = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "") // strip all tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n") // remove excessive blank lines
    .trim();
};

const sendEmail = async (emailData) => {
  try {
    const {
      to,
      subject,
      html = "",
      text = "",
      from,
      cc,
      bcc,
      attachments,
    } = emailData;

    if (!to) throw new Error("Recipient email (to) is required");
    if (!subject) throw new Error("Email subject is required");

    const plainText = text || generatePlainTextFromHtml(html);

    const mailOptions = {
      from: from || '"Dr. Rajneesh Kanth" <noreply@petstore.com>',
      to,
      subject,
      html,
      text: plainText,
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (attachments && Array.isArray(attachments))
      mailOptions.attachments = attachments;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    console.log("🔍 Email data attempted:", {
      to: emailData.to,
      subject: emailData.subject,
    });
    throw error;
  }
};

module.exports = {
  sendEmail,
};
