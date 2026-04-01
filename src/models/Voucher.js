import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    pcfNo: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    rfId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestForm',
        required: true,
    },
    date: Date,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    receipts: [{type: String}],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {type: String, default: 'approved'}
}, {timestamps: true})

export const Voucher = mongoose.model('Voucher', voucherSchema);