const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');

// Roll number validation regex
const rollRegex = /^25[0-9]{8}$/;

exports.registerStudent = async (req, res) => {
    try {
        const { rollNo, email, password, section } = req.body;

        // Validate roll number format
        if (!rollRegex.test(rollNo)) {
            return res.status(400).json({ message: 'Invalid Roll Number format' });
        }

        // Basic validation
        if (!rollNo || !email || !password || !section) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into database
        await sql.query`
            INSERT INTO Students (RollNo, Email, PasswordHash, Section)
            VALUES (${rollNo}, ${email}, ${hashedPassword}, ${section})
        `;

        res.status(201).json({ message: 'Student registered successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
};


exports.loginStudent = async (req, res) => {
    try {
        const { rollNo, password } = req.body;

        if (!rollNo || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check student exists
        const result = await sql.query`
            SELECT * FROM Students WHERE RollNo = ${rollNo}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const student = result.recordset[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, student.PasswordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create session
        req.session.user = {
            role: 'student',
            rollNo: student.RollNo
        };

        res.json({ message: 'Login successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed' });
    }
};


exports.uploadCertificate = async (req, res) => {
    try {
        const rollNo = req.session.user.rollNo;
        const { certificateType } = req.body;

        // Check deadline
        const deadlineResult = await sql.query`
            SELECT TOP 1 SubmissionDeadline, IsLocked
            FROM Deadlines
            ORDER BY DeadlineID DESC
        `;

        const deadlineData = deadlineResult.recordset[0];

        if (!deadlineData) {
            return res.status(400).json({ message: 'Submission deadline not configured' });
        }

        const now = new Date();
        const deadline = new Date(deadlineData.SubmissionDeadline);

        if (deadlineData.IsLocked || now > deadline) {
            return res.status(403).json({ message: 'Submission deadline has passed' });
        }

        if (!certificateType) {
            return res.status(400).json({ message: 'Certificate type required' });
        }

        const allowedTypes = [
            'HTML Essentials',
            'CSS',
            'JavaScript 1',
            'JavaScript 2'
        ];

        if (!allowedTypes.includes(certificateType)) {
            return res.status(400).json({ message: 'Invalid certificate type' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'File upload required' });
        }

        const filePath = req.file.path;

        await sql.query`
            INSERT INTO Certificates (RollNo, CertificateType, FilePath)
            VALUES (${rollNo}, ${certificateType}, ${filePath})
        `;

        res.json({ message: 'Certificate uploaded successfully (Pending Approval)' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Upload failed' });
    }
};

exports.getStudentDashboard = async (req, res) => {
    try {
        const rollNo = req.session.user.rollNo;

        // Get certificates
        const result = await sql.query`
            SELECT CertificateType, Status, Remarks
            FROM Certificates
            WHERE RollNo = ${rollNo}
        `;

        const certificates = result.recordset;

        // Calculate marks
        const approvedCount = certificates.filter(c => c.Status === 'Approved').length;
        const marks = approvedCount * 1.25;

        // Get latest deadline
        const deadlineResult = await sql.query`
            SELECT TOP 1 SubmissionDeadline
            FROM Deadlines
            ORDER BY DeadlineID DESC
        `;

        const deadline = deadlineResult.recordset.length > 0
            ? deadlineResult.recordset[0].SubmissionDeadline
            : null;

        res.json({
            rollNo,
            certificates,
            marks,
            deadline
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load dashboard' });
    }
};
