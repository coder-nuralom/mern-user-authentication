import nodemailer from "nodemailer";

export const sendOtpMail = async (name, email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailConfiguration = {
    form: process.env.SENDER_EMAIL,
    to: email,
    subject: "Password reset Otp.",
    html: `Hi ${name}. Your password rest OTP is:- <b>${otp}</b>. It is valid for 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailConfiguration);
  } catch (error) {
    console.error("Failed to send OTP:-", error);
  }
};
