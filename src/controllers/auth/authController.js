import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';

export const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find if user exist
    const findUser = await User.findOne({ email });
    if (!findUser) return res.status(400).json({error: 'User not Found'});

    // checks if the user is Active
    if (!findUser.isActive) return res.status(403).json({error: 'User Deactivated'});

    // checks the password
    const isMatch = await bcrypt.compare(password, findUser.password);
     if (!isMatch) return res.status(400).json({error: 'Invalid Credentials'});

    // generate token
    const token = jwt.sign({id: findUser._id, role: findUser.role}, process.env.JWT_SECRET_KEY, { expiresIn: '1d'});

    res.status(200).json({
        status: 'Login Successfull',
        data: {
            id: findUser._id,
            name: findUser.name,
            email: findUser.email,
            role: findUser.role
        },
        token: token
    });
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'});
    }

};

export const userLogout = async (req, res) => {
    res.status(200).json({
        status: 'Success',
        data: {
            message: 'User Logged out!'
        }
    })
};