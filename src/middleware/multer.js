import multer from "multer";
import { nanoid } from "nanoid";
import fs from "fs";
export const fileTypes = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  video: ["video/mp4"],
  audio: ["audio/mpeg"],
  pdf: ["application/pdf"],
};

export const multerLocal = (customValidation = [], customPath = "generals") => {
  const fullPath = `uploads/${customPath}`;
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${nanoid(4)}-${file.originalname}`);
    },
  });

  function fileFilter(req, file, cb) {
    console.log("Allowed file types:", customValidation);
    console.log("Uploaded file type:", file.mimetype);

    if (customValidation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format"), false);
    }
  }

  return multer({ storage, fileFilter });
};
export const multerHost = (customValidation = []) => {
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    console.log("Allowed file types:", customValidation);
    console.log("Uploaded file type:", file.mimetype);
    if (customValidation.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format"), false);
    }
  }
  return multer({ storage, fileFilter });
};
