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
/**
 * Send booking confirmation email
 * @param {string} to - Recipient email
 * @param {Object} bookingDetails
 */
async function sendBookingConfirmation(to, bookingDetails) {
  try {
    const mailOptions = {
     from: `"Dr. Rajneesh Clinic" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Booking Confirmation - ${bookingDetails.clinic_name}`,
      html: `
        <h2>Booking Confirmed ✅</h2>
        <p>Dear ${bookingDetails.patientName},</p>
        <p>Your session has been successfully booked.</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Clinic:</strong> ${bookingDetails.clinic_name}</li>
          <li><strong>Date:</strong> ${bookingDetails.date}</li>
          <li><strong>Time:</strong> ${bookingDetails.time}</li>
          <li><strong>Sessions:</strong> ${bookingDetails.sessions}</li>
          <li><strong>Amount Paid:</strong> ₹${bookingDetails.amount}</li>
        </ul>
        <p>Thank you for choosing our clinic!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent to:", to);
  } catch (err) {
    console.error("Error sending booking email:", err.message);
  }
}

module.exports = sendBookingConfirmation;
