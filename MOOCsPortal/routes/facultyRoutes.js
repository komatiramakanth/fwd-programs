const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { isFacultyLoggedIn } = require('../middleware/authMiddleware');


router.post('/login', facultyController.loginFaculty);

// View Pending Certificates
router.get('/dashboard', isFacultyLoggedIn, facultyController.viewPendingCertificates);

// Approve Certificate
router.post('/approve/:id',
    isFacultyLoggedIn,
    facultyController.approveCertificate
);

// Reject Certificate
router.post('/reject/:id',
    isFacultyLoggedIn,
    facultyController.rejectCertificate
);

// Export Report (All or Section-wise)
router.get('/export',
    isFacultyLoggedIn,
    facultyController.exportReport
);

// Download Certificates ZIP
router.get('/download-zip',
    isFacultyLoggedIn,
    facultyController.downloadCertificatesZip
);

// Analytics
router.get('/analytics',
    isFacultyLoggedIn,
    facultyController.getAnalytics
);

// Update Deadline
router.post('/update-deadline',
    isFacultyLoggedIn,
    facultyController.updateDeadline
);


module.exports = router;
