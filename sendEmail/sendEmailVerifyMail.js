import nodemailer from "nodemailer";
import "dotenv/config";

export const sendMail = async (token, name, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailConfiguration = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification",
    html: `
    <h3>Hi, ${name}</h3>
    <h1>Verify Your Email</h1>
    <br />
    <button><a href="https://mern-authentication-lemon.vercel.app/verify/${token}">Verify</a></button>
    `,
  };

  try {
    await transporter.sendMail(mailConfiguration);
  } catch (error) {
    console.error("Failed to send email:-", error);
  }
};
