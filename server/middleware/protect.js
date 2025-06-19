const userModel = require("../models/users/user.model");
const { verifyToken } = require("../utils/sendToken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies._usertoken) {
      token = req.cookies._usertoken;
    }
    console.log("token",token)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "You are not logged in. Please login to access this resource.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Find user
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Please log in again.",
      error: error.message,
    });
  }
};


exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role (${req.user?.role || "Unknown"}) is not authorized.`,
      });
    }
    next();
  };
};
