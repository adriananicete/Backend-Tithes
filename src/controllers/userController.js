import { User } from "../models/User.js";
import bcrypt from 'bcrypt';
import { recordAudit } from "../utils/recordAudit.js";

export const changePassword = async (req, res, next) => {
    try {

        const { id } = req.user;
        const { currentPassword, newPassword } = req.body;

        if(!newPassword || !currentPassword) return res.status(400).json({error: 'All fields must have a value'});

        const finderUserPassword = await User.findById(id);
        if(!finderUserPassword) return res.status(404).json({error: 'User not found'});

        const isMatch = await bcrypt.compare(currentPassword, finderUserPassword.password);
        if(!isMatch) return res.status(400).json({error: 'Current Password did not match'});

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const findeUser = await User.findByIdAndUpdate(id,{$set: {password: hashedPassword}},{new:true});

        await recordAudit({
            req,
            action: 'user.change_password',
            targetModel: 'User',
            targetId: id,
            targetRef: finderUserPassword.email,
            summary: 'Changed own password',
        });

        res.status(200).json({
            status: 'Success',
            message: 'Password Changed!',
        });
    } catch (error) {
        next(error);
    }
}