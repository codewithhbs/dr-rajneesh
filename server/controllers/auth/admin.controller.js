const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/users/Admin.model");


const generateToken = (admin) => {
    return jwt.sign(
        {
            id: admin._id,
            role: admin.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};
exports.registerAdmin = async (req, res) => {
    try {
        const { name, password, role } = req.body;

        const exists = await Admin.findOne({ name });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            password: hashedPassword,
            role: role || "admin"
        });

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: admin
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Register failed",
            error: err.message
        });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { name, password } = req.body;

        const admin = await Admin.findOne({ name }).select("+password");

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = generateToken(admin);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                id: admin._id,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: err.message
        });
    }
};


exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("-password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: admin
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: err.message
        });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.user.id).select("+password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        admin.password = await bcrypt.hash(newPassword, 10);
        admin.password_changes_last_time = new Date();

        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Password change failed",
            error: err.message
        });
    }
};

exports.changeAdminRole = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { role } = req.body;

        if (!["admin", "superadmin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        admin.role = role;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: admin
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Role update failed",
            error: err.message
        });
    }
};