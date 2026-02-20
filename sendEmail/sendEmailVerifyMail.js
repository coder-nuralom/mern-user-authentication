import nodemailer from "nodemailer";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const templatePath = path.join(__dirName, "template.ejs");
console.log(templatePath);

export const sendMail = async (token, name, email) => {
  try {
    const htmlToSend = await ejs.renderFile(templatePath, {
      name,
      token: encodeURIComponent(token),
      frontendUrl: process.env.FRONTEND_URL,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailConfiguration = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    };

    await transporter.sendMail(mailConfiguration);
  } catch (error) {
    console.error("Failed to send email:-", error);
  }
};
