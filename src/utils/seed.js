import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { User } from '../models/User.js'

const seed = async () => {
    await mongoose.connect(process.env.CONNECTION_STRING)

    const hashedPassword = await bcrypt.hash('admin123', 10)

    await User.create({
        name: 'Adrian',
        email: 'adrian@joscm.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
    })

    console.log('Seeded successfully')
    process.exit()
}

seed()