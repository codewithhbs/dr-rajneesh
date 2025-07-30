const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // Basic user information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],

    },

    aadhhar: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                return /^\d{12}$/.test(value);
            },
            message: 'Aadhaar number must be 12 digits'
        },
       
    },
    
    phone: {
        type: String,
        required: function () {
            return !this.isGoogleAuth;
        },
        validate: {
            validator: function (value) {
                if (!this.isGoogleAuth) {
                    return /^\d{10}$/.test(value);
                }
                return true;
            },
            message: 'Phone number must be 10 digits'
        },

        trim: true,


    },
    new_number:{
        type: String,
        validate: {
            validator: function (value) {
                return /^\d{10}$/.test(value);
            },
            message: 'New phone number must be 10 digits'
        },
        trim: true
    },
    new_email:{
        type: String,
        trim: true,
    },

    // Profile image with validation
    profileImage: {
        url: {
            type: String,
            trim: true,

        },
        publicId: {
            type: String,
            trim: true
        }
    },

    // Password with proper validation
    password: {
        type: String,

        minlength: [8, 'Password must be at least 8 characters'],
        validate: {
            validator: function (password) {
                if (!password && this.isGoogleAuth) return true;
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },

    // Terms acceptance
    termsAccepted: {
        type: Boolean,
        required: [true, 'Terms and conditions must be accepted'],
        default: false
    },

    // Email verification
    emailVerification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String,
            trim: true
        },
        otpExpiry: {
            type: Date
        }
    },
    phoneNumber: {
        isVerified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String,
            trim: true
        },
        otpExpiry: {
            type: Date
        }
    },

    // Password reset
    passwordReset: {
        otp: {
            type: String,
            trim: true
        },
        otpExpiry: {
            type: Date
        },
        lastResetAt: {
            type: Date
        }
    },

    // Authentication methods
    isGoogleAuth: {
        type: Boolean,
        default: false
    },
    isPhoneAuth: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        sparse: true,
        trim: true
    },

    // Account status
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted', 'un-verified'],
        default: 'un-verified'
    },

    // Security and tracking
    lastLoginAt: {
        type: Date
    },

    loginAttempts: {
        type: Number,
        default: 0
    },

    lockUntil: {
        type: Date
    },

    // Metadata
    ipAddress: {
        type: String,
        trim: true
    },

    userAgent: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'user'
    }

}, {
    timestamps: true,
    collection: 'users'
});


userSchema.index({ phone: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'emailVerification.isVerified': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { loginAttempts: 1, lockUntil: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours

    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLoginAt: new Date() }
    });
};

// Static method to find active users
userSchema.statics.findActive = function () {
    return this.find({ status: 'active' });
};

// Static method to find verified users
userSchema.statics.findVerified = function () {
    return this.find({ 'emailVerification.isVerified': true });
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret?.password;
        delete ret?.loginAttempts;
        delete ret?.lockUntil;

        if (ret?.emailVerification?.token) {
            delete ret.emailVerification.token;
        }
        if (ret?.passwordReset?.token) {
            delete ret.passwordReset.token;
        }

        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);