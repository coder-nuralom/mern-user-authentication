import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendMail } from "../sendEmail/sendEmailVerifyMail.js";
import { Session } from "../models/sessionModel.js";
import crypto from "crypto";
import { sendOtpMail } from "../sendEmail/sendOtp.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }
  try {
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });

    await sendMail(token, name, email);
    newUser.token = token;
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully..!",
      userData: newUser,
      token,
    });
  } catch (error) {
    console.error("User register Error:-", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Network or server Error.",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        succss: false,
        message: "authorization token is missing or invalid.",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "The verification token has  expired.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid Verification token.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.token = null;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully..!",
    });
  } catch (error) {
    console.error("Email Verification failed error:-", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Failed to verify email.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "User email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No User Found with this email.",
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password.",
      });
    }

    if (user.isVerified !== true) {
      return res.status(401).json({
        success: false,
        message: "Please Verify your email first.",
      });
    }

    const existingSession = await Session.findOne({ userId: user._id });
    if (existingSession) {
      await Session.deleteOne({ userId: user._id });
    }

    // create session
    await Session.create({ userId: user._id });

    const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "10d",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      success: true,
      message: `Welcome ${user.name}`,
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error("Login Error:-", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login. Server or Network Down.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.userId;
    await Session.deleteMany({ userId });
    return res.status(200).json({
      success: true,
      message: "Logged out successfully..!",
    });
  } catch (error) {
    console.error("Logout Error:-", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout.! Something went wrong.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email.",
      });
    }

    const name = user.name;

    const otp = (Math.floor(Math.random() * 900000) + 100000).toString();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const otpExpiry = Date.now() + 2 * 60 * 1000;

    user.otp = hashedOtp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpMail(name, email, otp);

    return res.status(200).json({
      success: true,
      message: "An OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot Password Error:-", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Server or Internet down.",
    });
  }
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const { email } = req.params;

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: "OTP is required.!",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: true,
        message: "User not found.",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(409).json({
        success: false,
        message: "OTP not generated or already verified.",
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(409).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOTP !== user.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP Verified Successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:-", error);
    return res.status(500).json({
      success: false,
      message: "Internel server error. Failed to verify otp.",
    });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // generate new otp
    const newOtp = Math.floor(Math.random() * 900000 + 100000).toString();

    const otpExpiry = Date.now() + 2 * 60 * 1000;

    const hashedOtp = crypto.createHash("sha256").update(newOtp).digest("hex");

    user.otp = hashedOtp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpMail(user.name, user.email, newOtp);

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully..!",
    });
  } catch (error) {
    console.error("Resend OTP error:-", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP.",
    });
  }
};

export const changePassword = async (req, res) => {
  const { newPassword, confirmNewPassword } = req.body;
  const { email } = req.params;

  if (!newPassword || !confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "Password do not match.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully..!",
    });
  } catch (error) {
    console.error("Password changing error:-", error);
    return res.status(500).json({
      success: false,
      message: "Internel server error. Failed to change password.",
    });
  }
};
