const userModel = require("../../models/users/user.model");
const emailQueue = require("../../queues/emailQueue");
const generateOtp = require("../../utils/otp");
const { sendEmail } = require("../../utils/sendEmail");
const { sendToken } = require("../../utils/sendToken");
const axios = require("axios");
const Bookings = require("../../models/booking/bookings.sessions.model");

const createOtpExpiry = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

exports.registerNormalUser = async (req, res, next) => {
    try {
        const { name, email, phone, password, confirmPassword, termsAccepted } =
            req.body;

        if (!name || !email || !phone || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                message: "Please accept terms and conditions",
            });
        }

        const existingUser = await userModel.findOne({
            $or: [{ email }, { phone }],
        });

        const otp = generateOtp();
        const otpExpiry = createOtpExpiry(30); // expires in 30 minutes

        if (existingUser) {
            if (
                existingUser.status === "active" &&
                existingUser.emailVerification?.isVerified
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        existingUser.email === email
                            ? "Email already registered"
                            : "Phone number already registered",
                });
            }

            // User exists but not verified or inactive → update existing user
            existingUser.name = name.trim();
            existingUser.phone = phone.trim();
            existingUser.password = password;
            existingUser.termsAccepted = termsAccepted;
            existingUser.profileImage = {
                url: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
                publicId: "",
            };
            existingUser.emailVerification = {
                isVerified: false,
                otp,
                otpExpiry,
            };
            existingUser.status = "un-verified";

            await existingUser.save();

            // Send new verification email
            const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome back to Our Platform!</h2>
            <p>Hello ${name},</p>
            <p>Please verify your email using the OTP below:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h3 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h3>
            </div>
            <p>This OTP will expire in 30 minutes.</p>
            <p>If you didn’t request this, please ignore this email.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
        </div>
      `;

            emailQueue
                .add({
                    type: "register",
                    to: email,
                    subject: "Verify Your Email Address",
                    html: emailHtml,
                })
                .then((job) => {
                    console.log("✅ Job added to queue with ID:", job.id);
                })
                .catch((error) => {
                    console.error("❌ Error adding job to queue:", error);
                });

            return res.status(200).json({
                success: true,
                message:
                    "Your account is not verified. A new OTP has been sent to your email.",
                userId: existingUser._id,
            });
        }

        // New User creation
        const newUser = new userModel({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password,
            termsAccepted,
            profileImage: {
                url: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
                publicId: "",
            },
            emailVerification: {
                isVerified: false,
                otp,
                otpExpiry,
            },
            status: "un-verified",
        });

        await newUser.save();

        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering. Please verify your email address using the OTP below:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h3>
          </div>
          <p>This OTP will expire in 30 minutes.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `;

        emailQueue
            .add({
                type: "register",
                to: email,
                subject: "Verify Your Email Address",
                html: emailHtml,
            })
            .then((job) => {
                console.log("✅ Job added to queue with ID:", job.id);
            })
            .catch((error) => {
                console.error("❌ Error adding job to queue:", error);
            });

        res.status(201).json({
            success: true,
            message:
                "Registration successful! Please check your email for verification OTP.",
            userId: newUser._id,
        });
    } catch (error) {
        next(error);
    }
};

exports.registerNormal = async (req, res, next) => {
    try {
        const { name, phone, termsAccepted = true } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingUser = await userModel.findOne({
            $or: [{ phone }],
        });

        const otp = generateOtp();
        const otpExpiry = createOtpExpiry(30); // expires in 30 minutes

        if (existingUser) {
            if (
                existingUser.status === "active" &&
                existingUser.phoneNumber?.isVerified
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        existingUser.phone === phone
                            ? "Phone already registered"
                            : "Phone number already registered",
                });
            }

            // User exists but not verified or inactive → update existing user
            existingUser.name = name.trim();
            existingUser.phone = phone.trim();
            existingUser.termsAccepted = termsAccepted;
            existingUser.profileImage = {
                url: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
                publicId: "",
            };
            existingUser.phoneNumber = {
                isVerified: false,
                otp,
                otpExpiry,
            };
            existingUser.status = "un-verified";

            await existingUser.save();


            return res.status(200).json({
                success: true,
                message:
                    "Your account is not verified. A new OTP has been sent to your phone number.",
                userId: existingUser._id,
            });
        }

        // New User creation
        const newUser = new userModel({
            name: name.trim(),
            phone: phone.trim(),
            termsAccepted,
            profileImage: {
                url: `https://api.dicebear.com/9.x/initials/svg?seed=${name}`,
                publicId: "",
            },
            phoneNumber: {
                isVerified: false,
                otp,
                otpExpiry,
            },
            status: "un-verified",
        });

        await newUser.save();


        res.status(201).json({
            success: true,
            message:
                "Registration successful! Please check your Phone for verification OTP.",
            userId: newUser._id,
        });
    } catch (error) {
        next(error);
    }
};

exports.googleAuthRegisterAndLogin = async (req, res) => {
    const isGoogleAuth = true;
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
    const code = req.query.code;

    if (!code) return res.status(400).send("Missing authorization code.");

    try {
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("client_id", CLIENT_ID);
        params.append("client_secret", CLIENT_SECRET);
        params.append("redirect_uri", REDIRECT_URI);
        params.append("grant_type", "authorization_code");

        const { data: tokenData } = await axios.post(
            "https://oauth2.googleapis.com/token",
            params,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = tokenData.access_token;
        if (!accessToken) return res.status(400).send("Token exchange failed");

        const { data: userInfo } = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!userInfo.email) return res.status(400).send("No email from Google");

        const existingUser = await userModel.findOne({ email: userInfo.email });

        if (existingUser) {
            if (!existingUser.isGoogleAuth) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This email is already registered. Please login using email and password.",
                });
            }

            console.log("Old user via Google login:", existingUser);
            const { token } = await sendToken(
                existingUser,
                200,
                res,
                "Login successful",
                false
            );
            return res.redirect(
                `http://localhost:3000/login/login-success?token=${encodeURIComponent(
                    token
                )}`
            );
        }

        const newUser = new userModel({
            name: userInfo.name.trim(),
            email: userInfo.email.toLowerCase().trim(),
            termsAccepted: true,
            profileImage: {
                url: userInfo.picture || "",
                publicId: "",
            },
            emailVerification: {
                isVerified: userInfo.verified_email || false,
            },
            isGoogleAuth,
            status: "active",
        });

        await newUser.save();

        console.log("data is save", newUser);

        const emailHtml = welcome(newUser);
        emailQueue
            .add({
                type: "welcome",
                to: newUser.email,
                subject: "Thank you for registering with us",
                html: emailHtml,
            })
            .then((job) => {
                console.log("✅ Email job queued:", job.id);
            })
            .catch((error) => {
                console.error("❌ Email queue error:", error);
            });
        const { token, user } = await sendToken(
            newUser,
            200,
            res,
            "Thank you for registering",
            false
        );
        return res.redirect(
            `http://localhost:3000/login/login-success?token=${encodeURIComponent(
                token
            )}`
        );
    } catch (err) {
        console.error("OAuth Error:", err.response?.data || err.message);
        return res.status(500).send("Google authentication failed.");
    }
};


// Verify Email OTP
exports.verifyEmailOtp = async (req, res, next) => {
    try {
        const { email, otp, number } = req.body;

        if (!otp || (!email && !number)) {
            return res.status(400).json({
                success: false,
                message: "OTP and either Email or Phone Number are required",
            });
        }

        let user;

        // 🔹 Email OTP verification
        if (email) {
            user = await userModel.findOne({
                email: email.toLowerCase().trim(),
                "emailVerification.otp": otp,
                "emailVerification.otpExpiry": { $gt: new Date() },
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired email OTP",
                });
            }

            await userModel.findByIdAndUpdate(user._id, {
                "emailVerification.isVerified": true,
                status: "active",
                $unset: {
                    "emailVerification.otp": 1,
                    "emailVerification.otpExpiry": 1,
                },
            });

            // ✅ Send email only for email verification
            const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - Dr. Rajneesh Kant</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
    
    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; line-height: 60px; text-align: center;">
                                            🏥
                                        </div>
                                        
                                        <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
                                            Dr. Rajneesh Kant
                                        </h1>
                                        
                                        <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.9; text-align: center;">
                                            Physiotherapy & Chiropractic Care
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Success Badge -->
                    <tr>
                        <td style="padding: 0 30px; text-align: center; transform: translateY(-20px);">
                            <div style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
                                ✓ Email Verified Successfully
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 30px 40px;">
                            
                            <!-- Welcome Title -->
                            <h2 style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                Welcome to Our Wellness Family!
                            </h2>
                            
                            <!-- Content Text -->
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                                Dear <strong style="color: #2563eb;">${user.name}</strong>,
                            </p>
                            
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                                Your email has been successfully verified. We're thrilled to welcome you to Dr. Rajneesh Kant's clinic - your trusted partner for physiotherapy and chiropractic care in Faridabad.
                            </p>
                            
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
                                Our clinic specializes in personalized treatment plans designed to help you recover, heal, and achieve optimal wellness through modern therapeutic techniques.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Features Section -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                            What You Can Do Now
                                        </h3>
                                        
                                        <!-- Features Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">📅</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Book appointments<br>online
                                                    </p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">📋</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Access health<br>resources
                                                    </p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">💬</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Get personalized<br>care tips
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Stats Section -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1f2937; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                            Why Choose Our Clinic?
                                        </h3>
                                        
                                        <!-- Stats Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">15+</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Years Experience</p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">500+</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Happy Patients</p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">98%</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Success Rate</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA Buttons -->
                    <tr>
                        <td style="padding: 0 30px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; min-width: 180px;">
                                            📅 Book Appointment
                                        </a>
                                    </td>
                                    <td align="center" style="padding: 10px;">
                                        <a href="#" style="display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; min-width: 180px;">
                                            🔍 View Services
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Contact Information -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0 0 20px 0; text-align: center;">
                                            Get In Touch
                                        </h3>
                                        
                                        <!-- Contact Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50%" style="padding: 10px; vertical-align: middle;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="vertical-align: middle; padding-right: 12px;">
                                                                <div style="width: 40px; height: 40px; background-color: #2563eb; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; line-height: 40px; text-align: center;">
                                                                    📞
                                                                </div>
                                                            </td>
                                                            <td style="vertical-align: middle;">
                                                                <div style="color: #374151; font-size: 16px; font-weight: bold;">
                                                                    +91 98765 43210
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%" style="padding: 10px; vertical-align: middle;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="vertical-align: middle; padding-right: 12px;">
                                                                <div style="width: 40px; height: 40px; background-color: #10b981; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; line-height: 40px; text-align: center;">
                                                                    📍
                                                                </div>
                                                            </td>
                                                            <td style="vertical-align: middle;">
                                                                <div style="color: #374151; font-size: 16px; font-weight: bold;">
                                                                    Faridabad, Haryana
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Final Message -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
                                If you have any questions or need assistance, feel free to reach out. We're here to support your wellness journey every step of the way.
                            </p>
                            
                            <!-- Signature -->
                            <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                                <p style="color: #2563eb; font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">
                                    Best regards,
                                </p>
                                <p style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">
                                    Dr. Rajneesh Kant & Team
                                </p>
                                <p style="color: #6b7280; font-size: 14px; margin: 0; font-style: italic;">
                                    Physiotherapy & Chiropractic Care
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 30px; text-align: center;">
                            <div style="margin-bottom: 20px;">
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Home</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Services</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">About</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Contact</a>
                            </div>
                            
                            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                                This is an automated message. Please do not reply.<br>
                                © 2024 Dr. Rajneesh Kant. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Mobile Responsive Styles -->
    <style>
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
            }
            
            .mobile-padding {
                padding: 20px !important;
            }
            
            .mobile-text {
                font-size: 14px !important;
            }
            
            .mobile-title {
                font-size: 24px !important;
            }
            
            .mobile-button {
                display: block !important;
                width: 100% !important;
                margin: 10px 0 !important;
            }
            
            .mobile-stack {
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                padding: 10px 0 !important;
            }
        }
    </style>
    
</body>
        </html>`;


            emailQueue
                .add({
                    type: "welcome",
                    to: email,
                    subject: "Thank you for registering with us",
                    html: emailHtml,
                })
                .then((job) => console.log("✅ Email job added:", job.id))
                .catch((error) => console.error("❌ Email job error:", error));
        }

        // 🔸 Phone OTP verification
        else if (number) {
            user = await userModel.findOne({
                phone: number.trim(),
                "phoneNumber.otp": otp,
                "phoneNumber.otpExpiry": { $gt: new Date() },
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired phone OTP",
                });
            }

            await userModel.findByIdAndUpdate(user._id, {
                "phoneNumber.isVerified": true,
                status: "active",
                $unset: {
                    "phoneNumber.otp": 1,
                    "phoneNumber.otpExpiry": 1,
                },
            });
        }

        await sendToken(user, 200, res, "Verification successful");
    } catch (error) {
        next(error);
    }
};

// Login User
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Find user and include password for comparison
        const user = await userModel.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message:
                    "Account temporarily locked due to too many failed login attempts",
            });
        }

        // Check if account is active
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Account is suspended or deactivated",
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            await user.incLoginAttempts();
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check if email is verified
        if (!user.emailVerification.isVerified && !user.isGoogleAuth) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in",
            });
        }

        // Reset login attempts and update last login
        await user.resetLoginAttempts();

        // Update user info
        await userModel.findByIdAndUpdate(user._id, {
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });

        // Send token
        await sendToken(user, 200, res, "Login successful");
    } catch (error) {
        next(error);
    }
};

// Logout User
exports.logoutUser = async (req, res, next) => {
    try {
        res.cookie("_usertoken", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await userModel.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            // Don't reveal if email exists or not
            return res.status(200).json({
                success: true,
                message:
                    "If an account with this email exists, you will receive a password reset link.",
            });
        }

        // Check if user recently requested password reset
        if (
            user.passwordReset.lastResetAt &&
            new Date() - user.passwordReset.lastResetAt < 5 * 60 * 1000
        ) {
            // 5 minutes
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another password reset",
            });
        }

        const resetToken = generateSecureToken();
        const resetOtp = generateOtp();

        // Update user with reset token
        await userModel.findByIdAndUpdate(user._id, {
            "passwordReset.token": resetOtp,
            "passwordReset.tokenExpiry": createOtpExpiry(15), // 15 minutes
            "passwordReset.lastResetAt": new Date(),
        });

        // Send reset email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password. Use the OTP below to reset your password:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #dc3545; font-size: 32px; margin: 0;">${resetOtp}</h3>
                </div>
                <p>This OTP will expire in 15 minutes.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
            </div>
        `;

        await sendEmail({
            to: user.email,
            subject: "Password Reset OTP",
            html: emailHtml,
        });

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email",
        });
    } catch (error) {
        next(error);
    }
};

// Verify Password Reset OTP
exports.verifyPasswordResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const user = await userModel.findOne({
            email: email.toLowerCase().trim(),
            "passwordReset.token": otp,
            "passwordReset.tokenExpiry": { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        // Generate temporary reset token for password change
        const tempToken = generateSecureToken();

        await userModel.findByIdAndUpdate(user._id, {
            "passwordReset.token": tempToken,
            "passwordReset.tokenExpiry": createOtpExpiry(5), // 5 minutes to change password
        });

        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken: tempToken,
        });
    } catch (error) {
        next(error);
    }
};

// Reset Password
const resetPassword = async (req, res, next) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        const user = await userModel.findOne({
            "passwordReset.token": resetToken,
            "passwordReset.tokenExpiry": { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Clear reset token
        await userModel.findByIdAndUpdate(user._id, {
            $unset: {
                "passwordReset.token": 1,
                "passwordReset.tokenExpiry": 1,
            },
        });

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Change Password (for logged-in users)
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match",
            });
        }

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Get User Profile
exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// Update User Profile
exports.updateUserProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const updates = {};

        if (name) updates.name = name.trim();
        if (phone) {
            // Check if phone number is already taken by another user
            const existingUser = await userModel.findOne({
                phone: phone.trim(),
                _id: { $ne: req.user.id },
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Phone number already registered",
                });
            }

            updates.phone = phone.trim();
        }

        const user = await userModel
            .findByIdAndUpdate(req.user.id, updates, {
                new: true,
                runValidators: true,
            })
            .select("-password");

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

// Update Profile Image
exports.updateProfileImage = async (req, res, next) => {
    try {
        const { imageUrl, publicId } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image URL is required",
            });
        }

        const user = await userModel
            .findByIdAndUpdate(
                req.user.id,
                {
                    "profileImage.url": imageUrl,
                    "profileImage.publicId": publicId || null,
                },
                { new: true, runValidators: true }
            )
            .select("-password");

        res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

// Delete Account
exports.deleteAccount = async (req, res, next) => {
    try {
        const { password, confirmDelete } = req.body;

        if (!password || confirmDelete !== "DELETE") {
            return res.status(400).json({
                success: false,
                message: "Password and confirmation are required",
            });
        }

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }

        // Soft delete - update status instead of removing document
        await userModel.findByIdAndUpdate(req.user.id, {
            status: "deleted",
            email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
            phone: `deleted_${Date.now()}_${user.phone}`, // Prevent phone conflicts
        });

        // Clear cookie
        res.cookie("_usertoken", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Resend Verification Email
exports.resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await userModel.findOne({
            email: email.toLowerCase().trim(),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.emailVerification.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        const otp = generateOtp();

        // Update user with new OTP
        await userModel.findByIdAndUpdate(user._id, {
            "emailVerification.token": otp,
            "emailVerification.tokenExpiry": createOtpExpiry(30),
        });

        // Send verification email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p>Hello ${user.name},</p>
                <p>Please verify your email address using the OTP below:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h3>
                </div>
                <p>This OTP will expire in 30 minutes.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
            </div>
        `;

        await sendEmail({
            to: user.email,
            subject: "Verify Your Email Address",
            html: emailHtml,
        });

        res.status(200).json({
            success: true,
            message: "Verification email sent successfully",
        });
    } catch (error) {
        next(error);
    }
};

//Get Booking History
exports.getBookingHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Fetch all bookings for the user
        const bookings = await Bookings.find({ session_booking_user: userId })
            .populate("session_booking_for_clinic")
            .populate("session_booking_for_doctor")
            .populate("payment_id")
            .populate("treatment_id")
            .sort({ createdAt: -1 });

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

        // Helper function to determine if booking is "current"
        const isCurrentBooking = (booking) => {
            const sessionDates = booking.SessionDates || [];

            // Check if booking is completed or cancelled
            if (["Completed", "Cancelled"].includes(booking.session_status)) {
                return false;
            }

            // Check for upcoming sessions (today or future)
            const hasUpcomingSessions = sessionDates.some((session) => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                return (
                    sessionDate >= today &&
                    ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                );
            });

            // Check for sessions scheduled today
            const hasTodaySession = sessionDates.some((session) => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                return (
                    sessionDate.getTime() === today.getTime() &&
                    ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                );
            });

            // Check if booking has partial completion (some sessions done, some pending)
            const hasCompletedSessions = sessionDates.some(
                (session) => session.status === "Completed"
            );
            const hasPendingSessions = sessionDates.some((session) =>
                ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
            );
            const isPartiallyCompleted = hasCompletedSessions && hasPendingSessions;

            // Return true if any of these conditions are met
            return hasUpcomingSessions || hasTodaySession || isPartiallyCompleted;
        };

        // Process all bookings
        const processedBookings = bookings.map((booking) => {
            const totalSessions = booking.no_of_session_book || 0;
            const sessionDates = booking.SessionDates || [];

            // Count completed sessions
            const completedSessions = sessionDates.filter(
                (session) => session.status === "Completed"
            ).length;

            // Calculate completion percentage
            const completionPercent =
                totalSessions > 0
                    ? Math.round((completedSessions / totalSessions) * 100)
                    : 0;

            // Check if any session is scheduled today
            const hasTodaySession = sessionDates.some((session) => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                return (
                    sessionDate.getTime() === today.getTime() &&
                    ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                );
            });

            // Find next upcoming session
            const nextSession = sessionDates
                .filter((session) => {
                    const sessionDate = new Date(session.date);
                    return (
                        sessionDate >= now &&
                        ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                    );
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

            // Count pending/upcoming sessions
            const pendingSessions = sessionDates.filter((session) =>
                ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
            ).length;

            return {
                ...booking.toObject(),
                completionPercent,
                hasTodaySession,
                nextSession: nextSession || null,
                pendingSessions,
                isCurrentBooking: isCurrentBooking(booking),
            };
        });

        // Separate current and history bookings
        const currentBookings = processedBookings.filter(
            (booking) => booking.isCurrentBooking
        );
        const historyBookings = processedBookings.filter(
            (booking) => !booking.isCurrentBooking
        );

        // Sort current bookings by priority (today's sessions first, then by next session date)
        currentBookings.sort((a, b) => {
            // Priority 1: Today's sessions first
            if (a.hasTodaySession && !b.hasTodaySession) return -1;
            if (!a.hasTodaySession && b.hasTodaySession) return 1;

            // Priority 2: By next session date (earliest first)
            if (a.nextSession && b.nextSession) {
                return new Date(a.nextSession.date) - new Date(b.nextSession.date);
            }
            if (a.nextSession && !b.nextSession) return -1;
            if (!a.nextSession && b.nextSession) return 1;

            // Priority 3: By creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.status(200).json({
            success: true,
            bookings: {
                current: currentBookings,
                history: historyBookings,
                summary: {
                    totalBookings: bookings.length,
                    currentBookingsCount: currentBookings.length,
                    historyBookingsCount: historyBookings.length,
                    todaySessionsCount: processedBookings.filter((b) => b.hasTodaySession)
                        .length,
                },
            },
        });
    } catch (error) {
        console.error("Error in getBookingHistory:", error);
        next(error);
    }
};

//welcome mail content

function welcome(user) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - Dr. Rajneesh Kant</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
    
    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; line-height: 60px; text-align: center;">
                                            🏥
                                        </div>
                                        
                                        <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; text-align: center;">
                                            Dr. Rajneesh Kant
                                        </h1>
                                        
                                        <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.9; text-align: center;">
                                            Physiotherapy & Chiropractic Care
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Success Badge -->
                    <tr>
                        <td style="padding: 0 30px; text-align: center; transform: translateY(-20px);">
                            <div style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
                                ✓ Email Verified Successfully
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 20px 30px 40px;">
                            
                            <!-- Welcome Title -->
                            <h2 style="color: #1f2937; font-size: 32px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                Welcome to Our Wellness Family!
                            </h2>
                            
                            <!-- Content Text -->
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                                Dear <strong style="color: #2563eb;">${user.name}</strong>,
                            </p>
                            
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                                Your email has been successfully verified. We're thrilled to welcome you to Dr. Rajneesh Kant's clinic - your trusted partner for physiotherapy and chiropractic care in Faridabad.
                            </p>
                            
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
                                Our clinic specializes in personalized treatment plans designed to help you recover, heal, and achieve optimal wellness through modern therapeutic techniques.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Features Section -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                            What You Can Do Now
                                        </h3>
                                        
                                        <!-- Features Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">📅</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Book appointments<br>online
                                                    </p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">📋</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Access health<br>resources
                                                    </p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 15px; vertical-align: top;">
                                                    <div style="font-size: 36px; margin-bottom: 12px; line-height: 1;">💬</div>
                                                    <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.4;">
                                                        Get personalized<br>care tips
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Stats Section -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1f2937; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-align: center;">
                                            Why Choose Our Clinic?
                                        </h3>
                                        
                                        <!-- Stats Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">15+</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Years Experience</p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">500+</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Happy Patients</p>
                                                </td>
                                                <td width="33.33%" style="text-align: center; padding: 10px; vertical-align: top;">
                                                    <div style="color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">98%</div>
                                                    <p style="color: #d1d5db; font-size: 14px; margin: 0;">Success Rate</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA Buttons -->
                    <tr>
                        <td style="padding: 0 30px 30px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; min-width: 180px;">
                                            📅 Book Appointment
                                        </a>
                                    </td>
                                    <td align="center" style="padding: 10px;">
                                        <a href="#" style="display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; min-width: 180px;">
                                            🔍 View Services
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Contact Information -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 25px;">
                                <tr>
                                    <td>
                                        <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0 0 20px 0; text-align: center;">
                                            Get In Touch
                                        </h3>
                                        
                                        <!-- Contact Grid -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="50%" style="padding: 10px; vertical-align: middle;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="vertical-align: middle; padding-right: 12px;">
                                                                <div style="width: 40px; height: 40px; background-color: #2563eb; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; line-height: 40px; text-align: center;">
                                                                    📞
                                                                </div>
                                                            </td>
                                                            <td style="vertical-align: middle;">
                                                                <div style="color: #374151; font-size: 16px; font-weight: bold;">
                                                                    +91 98765 43210
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="50%" style="padding: 10px; vertical-align: middle;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="vertical-align: middle; padding-right: 12px;">
                                                                <div style="width: 40px; height: 40px; background-color: #10b981; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; line-height: 40px; text-align: center;">
                                                                    📍
                                                                </div>
                                                            </td>
                                                            <td style="vertical-align: middle;">
                                                                <div style="color: #374151; font-size: 16px; font-weight: bold;">
                                                                    Faridabad, Haryana
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Final Message -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0; line-height: 1.6;">
                                If you have any questions or need assistance, feel free to reach out. We're here to support your wellness journey every step of the way.
                            </p>
                            
                            <!-- Signature -->
                            <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                                <p style="color: #2563eb; font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">
                                    Best regards,
                                </p>
                                <p style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">
                                    Dr. Rajneesh Kant & Team
                                </p>
                                <p style="color: #6b7280; font-size: 14px; margin: 0; font-style: italic;">
                                    Physiotherapy & Chiropractic Care
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 30px; text-align: center;">
                            <div style="margin-bottom: 20px;">
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Home</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Services</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">About</a>
                                <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 12px; font-size: 14px;">Contact</a>
                            </div>
                            
                            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                                This is an automated message. Please do not reply.<br>
                                © 2024 Dr. Rajneesh Kant. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Mobile Responsive Styles -->
    <style>
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
            }
            
            .mobile-padding {
                padding: 20px !important;
            }
            
            .mobile-text {
                font-size: 14px !important;
            }
            
            .mobile-title {
                font-size: 24px !important;
            }
            
            .mobile-button {
                display: block !important;
                width: 100% !important;
                margin: 10px 0 !important;
            }
            
            .mobile-stack {
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                padding: 10px 0 !important;
            }
        }
    </style>
    
</body>
</html>`;
}



