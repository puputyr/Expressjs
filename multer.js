const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Mendapatkan __dirname dalam CommonJS
// const __dirname = path.resolve();

// Pastikan folder "uploads" ada
const uploadDir = path.join(__dirname, "/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi diskStorage
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder penyimpanan file
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname) // Penamaan file
    );
  },
});

// Middleware multer dengan konfigurasi diskStorage
const upload = multer({ storage: diskStorage });

module.exports = {
  diskStorage,
  upload,
};
