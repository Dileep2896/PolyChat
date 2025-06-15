import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  // Logic for handling user registration
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // Generate a random index for profile picture
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      fullName,
      email,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log("User created in Stream successfully:" + newUser.fullName);
    } catch (error) {
      console.error("Error creating user in Stream:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // prevent client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // prevent CSRF attacks
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Error during signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req, res) {
  // Logic for handling user login
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Login successful",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error during login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export function logout(req, res) {
  // Logic for handling user logout
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logout successful", success: true });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;

    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(
        "User updated in Stream successfully after onboarding: " +
          updatedUser.fullName
      );
    } catch (streamError) {
      console.error("Error updating user in Stream:", streamError.message);
    }

    res.status(200).json({
      message: "Onboarding completed successfully",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error during onboarding controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
