const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "notes",
    resource_type: "raw",
  },
});

const uploadFile = multer({ storage });

module.exports = uploadFile;
