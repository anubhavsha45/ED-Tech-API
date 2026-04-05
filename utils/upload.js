const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "video") {
      return {
        folder: "lectures/videos",
        resource_type: "video",
      };
    }

    if (file.fieldname === "notes") {
      return {
        folder: "lectures/notes",
        resource_type: "raw",
      };
    }

    return {
      folder: "lectures/misc",
      resource_type: "auto",
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
