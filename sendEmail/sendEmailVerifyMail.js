import nodemailer from "nodemailer";
import "dotenv/config";

export const sendMail = async (token, name, email) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailConfiguration = {
    from: process.env.SENDER_EMAIL,
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
