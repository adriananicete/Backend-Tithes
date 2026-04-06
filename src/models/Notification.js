import mongoose from "mongoose";

const notifSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["approval", "rejection","info", "reminder"],
        required: true
    },
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    refModel: {
        type: String,
        enum: ['Tithes','RequestForm','Voucher'],
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

export const Notification = mongoose.model('Notification', notifSchema);