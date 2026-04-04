import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    source: {
        type: String,
        enum: ['voucher','manual'],
        required: true,
    },
    linkedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    date: {
        type: Date,
        required: true,
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true})

export const Expense = mongoose.model('Expense', expenseSchema);