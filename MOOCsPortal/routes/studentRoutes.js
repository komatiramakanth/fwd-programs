const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isStudentLoggedIn } = require('../middleware/authMiddleware');

// Upload Certificate
router.post('/upload',
    isStudentLoggedIn,
    (req, res, next) => req.upload.single('certificate')(req, res, next),
    studentController.uploadCertificate
);


// Student Dashboard
router.get('/dashboard', isStudentLoggedIn, (req, res) => {
    res.send(`Welcome Student ${req.session.user.rollNo}`);
});

// Student Registration
router.post('/register', studentController.registerStudent);

// Student Login
router.post('/login', studentController.loginStudent);

router.get('/dashboard-data',
    isStudentLoggedIn,
    studentController.getStudentDashboard
);


module.exports = router;
