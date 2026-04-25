import bcrypt from "bcrypt";
import { User } from "../../models/User.js";

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("-password");

    res.status(200).json(allUsers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const findUserById = await User.findById(id).select("-password");
    if (!findUserById)
      return res.status(404).json({ error: "User not found!" });

    res.status(200).json({
      status: "User found!",
      data: {
        findUserById,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check if all fields have data
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Required all fields!" });

    // check email if it already exists
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ error: "User already exist" });

    // hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      isActive: true,
      role: role,
    });

    await newUser.save();

    res.status(201).json({
      status: "Success",
      message: "New user created!",
      data: {
        name: name,
        email: email,
        isActive: newUser.isActive,
        role: role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const updatedUser = await User.findByIdAndUpdate(id, body, {
      new: true,
    }).select("-password");
    if (!updatedUser) return res.status(404).json({ error: "User not found!" });

    res.status(200).json({
      status: "Success",
      message: "User updated",
      data: {
        updatedUser,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error.message);
  }
};

const isActiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const findUserByIdAndUpdate = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    ).select("-password");
    if (!findUserByIdAndUpdate)
      return res.status(404).json({ error: "User not found!" });

    res.status(200).json({
      status: "Success",
      message: "User Deactivated",
      data: {
        findUserByIdAndUpdate,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error.message);
  }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser  = await User.findByIdAndDelete(id);
        if(!deletedUser ) return res.status(404).json({ error: "User not found!" });

        res.status(200).json({
            status: 'Success',
            message: 'User Deleted'
        })
    } catch (error) {
        console.log(error);
    return res.status(500).json(error.message);
    }
};

export {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  isActiveUser,
  deleteUser,
};
