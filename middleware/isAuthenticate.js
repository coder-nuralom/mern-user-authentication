import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
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
          message: "Token has expired.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid Token.",
      });
    }

    const id = decoded.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    req.userId = user._id;
    next();
  } catch (error) {
    console.error("isAuthenticated Error:-", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// For one person one login , in one device.

// import jwt from "jsonwebtoken";
// import { Session } from "../models/session.model.js";

// export const isAuthenticated = async (req, res, next) => {
//   try {
//     const authHeader = req.header("Authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized. No token.",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     // 1️⃣ verify token
//     const decoded = jwt.verify(token, process.env.SECRET_KEY);

//     // 2️⃣ check session exist
//     const session = await Session.findOne({ userId: decoded.id });

//     if (!session) {
//       return res.status(401).json({
//         success: false,
//         message: "Session expired. Please login again.",
//       });
//     }

//     // pass user info
//     req.userId = decoded.id;

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid token.",
//     });
//   }
// };
