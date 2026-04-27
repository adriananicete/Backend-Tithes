import { Notification } from "../models/Notification.js"
import { emitToUser } from "../services/realtime.js";

export const sendNotification = async ({userId, message, type, refId, refModel }) => {
    const createNotif = new Notification({
        userId,
        message,
        type,
        refId,
        refModel
    });

    await createNotif.save();

    emitToUser(userId, "notification:new", createNotif);

    return createNotif
};
