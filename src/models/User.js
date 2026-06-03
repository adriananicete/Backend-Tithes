import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String,
    },
    email: {
        required: true,
        type: String,
        unique: true,
    },
    password: {
        required: true,
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        required: true,
        type: String,
        enum: ['admin','do','member','pastor','validator','auditor',]
    },
    // Password reset — stores the SHA-256 hash of the emailed token (never the
    // raw token) plus its expiry. Cleared once the password is reset.
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
}, {timestamps: true});

export const User = mongoose.model('User', userSchema);