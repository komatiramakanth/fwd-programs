const express = require('express');
const session = require('express-session');
const { connectDB } = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const path = require('path');
const multer = require('multer');
const facultyRoutes = require('./routes/facultyRoutes');


console.log("SERVER FILE LOADED");

const app = express();
const PORT = 5000;

// Connect to DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'moocs_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Static files
app.use(express.static(__dirname + '/views'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/public', express.static(__dirname + '/public'));


// Configure file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, PNG files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Make upload accessible in routes
app.use((req, res, next) => {
    req.upload = upload;
    next();
});


// Routes
app.use('/students', studentRoutes);

app.use('/faculty', facultyRoutes);


// Test route
app.get('/test', (req, res) => {
    res.sendFile(__dirname + '/views/register.html');
});

app.get('/', (req, res) => {
    res.send('MOOCs Portal Server Running...');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});
