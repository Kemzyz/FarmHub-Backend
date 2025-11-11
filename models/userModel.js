const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Core identity
    name: { type: String, required: true }, // fullname
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Roles
    role: { type: String, enum: ['buyer', 'farmer'], required: true },

    // Contact & profile
    phone: { type: String },
    country: { type: String },
    address: { type: String },
    location: { type: String },
    language: { type: String },
    avatarPath: { type: String },

    // Farmer-specific (optional for buyers)
    farmname: { type: String },

    // Verification flags
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    // Verification & reset tokens
    emailVerifyToken: { type: String },
    emailVerifyExpires: { type: Date },
    phoneOtp: { type: String },
    phoneOtpExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
