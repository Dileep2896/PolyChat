import { generateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const user = req.user;

    const token = generateStreamToken(user._id);

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating Stream token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
