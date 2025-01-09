import express from "express"
import { login, logout, signup, updateProfile, checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)


router.put("/update-profile", protectRoute, updateProfile)   //Not allowed everyone to update profile, so add middleware to protect this route

router.get("/check", protectRoute, checkAuth)

export default router;