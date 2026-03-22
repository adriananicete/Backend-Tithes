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
}, {timestamps: true});

export const User = mongoose.model('User', userSchema);