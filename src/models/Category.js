import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Sunday Service'
    },
    type: {
        type: String,
        enum: ['rf','expense'],
        required: true,
        default: 'expense',
    },
    color: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true});

export const Category = mongoose.model('Category', categorySchema);