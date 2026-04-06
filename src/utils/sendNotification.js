import { Notification } from "../models/Notification.js"

export const sendNotification = async ({userId, message, type, refId, refModel }) => {
    const createNotif = new Notification({
        userId,
        message,
        type,
        refId,
        refModel
    });

    await createNotif.save();

    return createNotif
};   