import express from "express";
import {
  signup,
  login,
  logout,
  onboard,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);

// Check if user is logged in or not
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ user: req.user, success: true });
});

export default router;
