// Middleware to handle image uploads using multer
import path from "path";
import multer from "multer";
import { nanoid } from "nanoid";

// Ensure the uploads directory exists
const uploadsDir = path.resolve(import.meta.dirname, "../..", "public", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${nanoid()}${ext}`;
    cb(null, filename);
  },
});

export const upload = multer({ storage });

// Export a helper to get the public URL for a stored file
export const getPublicUrl = (filename: string) => {
  // Assuming the server serves /uploads as static under /public
  return `/uploads/${filename}`;
};
