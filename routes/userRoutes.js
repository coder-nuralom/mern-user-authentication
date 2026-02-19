import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  register,
  resendOtp,
  verifyEmail,
  verifyOtp,
} from "../controllers/userController.js";
import { isAuthenticate } from "../middleware/isAuthenticate.js";

const router = express.Router();

// api method: POST
// api endpoit: /user/register
router.post("/register", register);

//api method: POST
// api endpoint : /user/verify
router.post("/verify", verifyEmail);

// api method: POST
// api endpoint : /user/login
router.post("/login", login);

// api method: POST
// api endpoint: /user/logout
router.post("/logout", isAuthenticate, logout);

//api method: POST
// api endpoint: /user/forgot-password
router.post("/forgot-password", forgotPassword);

//api method: POST
//api endpoint: /user/verifyOtp/:email
router.post("/verify-otp/:email", verifyOtp);

//api method: POST
//api endpoint: /user/verifyOtp/:email
router.post("/resend-otp/:email", resendOtp);

// api mehtod: POST
// api endPoint: user/change-password
router.post("/change-password/:email", changePassword);

export default router;
