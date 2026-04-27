import { Notification } from "../models/Notification.js"
import { User } from "../models/User.js";
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

// Fan out the same notification to every active user in the given roles.
// Pass excludeUserId to skip the actor (e.g., admin validating their own
// submission shouldn't notify themselves through the validator-role path).
export const sendNotificationToRoles = async ({ roles, message, type, refId, refModel, excludeUserId }) => {
    if (!Array.isArray(roles) || roles.length === 0) return [];

    const recipients = await User.find({
        role: { $in: roles },
        isActive: true,
    }).select("_id");

    const targets = recipients
        .map((u) => u._id)
        .filter((id) => !excludeUserId || id.toString() !== excludeUserId.toString());

    return Promise.all(
        targets.map((userId) =>
            sendNotification({ userId, message, type, refId, refModel })
        )
    );
};
