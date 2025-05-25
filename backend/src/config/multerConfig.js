const multer = require('multer');
const path = require('path');

// Set up storage destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the directory where uploaded files will be stored
        // The path is relative to the project root where you run the node process
        cb(null, 'backend/uploads/'); 
    },
    filename: (req, file, cb) => {
        // Define how the file should be named
        // We'll use the original filename with a timestamp to avoid collisions
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload; 