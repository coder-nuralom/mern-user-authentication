import nodemailer from "nodemailer";

export const sendOtpMail = async (name, email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailConfiguration = {
    form: process.env.MAIL_USER,
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
