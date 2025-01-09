import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

//Hashing the password, generating the token and saving the user to database
export const signup = async (req, res) => {

    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        //password should be at least 6 characters
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        //check if user already exists
        const user = await User.findOne({ email })
        if (user) return res.status(400).json({ message: "User already exists" })

        //hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //create user
        const newUser = new User({         // This is same as,
            fullName,                      // fullName: fullName
            email,                         // email: email
            password: hashedPassword
        })

        if (newUser) {
            //generate jwt tokem here
            generateToken(newUser._id, res);
            //save user
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            })

        } else {
            res.status(400).json({ message: "invalid user data" });
        }

    } catch (error) {
        console.log("Error in signup controller: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        //if user credentials is valid then generate jwt token here
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic
        })
    } catch (error) {
        console.log("Error in login controller: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }

}

export const logout = (req, res) => {
    // clear the cookie for logging out
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        console.log("Error in logout controller: ", error.message)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

//Endpoint to update user profile
export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body

        //getting user which requested to update profile
        const userId = req.user._id

        if(!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" })
        }

        //upload profile picture to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic)

        //update in database
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, { new: true })

        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error in updateProfile controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//Endpoint to check if user is authenticated or not
export const checkAuth = (req, res) =>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}