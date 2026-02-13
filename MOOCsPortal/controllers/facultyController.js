const { sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

exports.loginFaculty = async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        if (!employeeId || !password) {
            return res.status(400).json({ message: 'All fields required' });
        }

        const result = await sql.query`
            SELECT * FROM Faculty WHERE EmployeeID = ${employeeId}
        `;

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const faculty = result.recordset[0];

        const isMatch = await bcrypt.compare(password, faculty.PasswordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = {
            role: 'faculty',
            employeeId: faculty.EmployeeID
        };

        res.json({ message: 'Faculty login successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed' });
    }
};

exports.viewPendingCertificates = async (req, res) => {
    try {
        const { section } = req.query;

        let result;

        if (section) {
            result = await sql.query`
                SELECT c.CertificateID, c.RollNo, s.Section, c.CertificateType,
                       c.FilePath, c.Status, c.UploadedAt
                FROM Certificates c
                JOIN Students s ON c.RollNo = s.RollNo
                WHERE c.Status = 'Pending' AND s.Section = ${section}
                ORDER BY c.UploadedAt DESC
            `;
        } else {
            result = await sql.query`
                SELECT c.CertificateID, c.RollNo, s.Section, c.CertificateType,
                       c.FilePath, c.Status, c.UploadedAt
                FROM Certificates c
                JOIN Students s ON c.RollNo = s.RollNo
                WHERE c.Status = 'Pending'
                ORDER BY c.UploadedAt DESC
            `;
        }

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch certificates' });
    }
};

exports.approveCertificate = async (req, res) => {
    try {
        const certificateId = req.params.id;

        await sql.query`
            UPDATE Certificates
            SET Status = 'Approved',
                VerifiedAt = GETDATE(),
                Remarks = NULL
            WHERE CertificateID = ${certificateId}
        `;

        res.json({ message: 'Certificate Approved' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Approval failed' });
    }
};

exports.rejectCertificate = async (req, res) => {
    try {
        const certificateId = req.params.id;
        const { remarks } = req.body;

        await sql.query`
            UPDATE Certificates
            SET Status = 'Rejected',
                Remarks = ${remarks},
                VerifiedAt = GETDATE()
            WHERE CertificateID = ${certificateId}
        `;

        res.json({ message: 'Certificate Rejected' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Rejection failed' });
    }
};




exports.exportReport = async (req, res) => {
    try {
        const { section } = req.query;

        let result;

        if (section) {
            result = await sql.query`
                SELECT s.RollNo, s.Section, c.CertificateType,
                       c.Status, c.Remarks, c.UploadedAt, c.VerifiedAt
                FROM Certificates c
                JOIN Students s ON c.RollNo = s.RollNo
                WHERE s.Section = ${section}
                ORDER BY s.RollNo
            `;
        } else {
            result = await sql.query`
                SELECT s.RollNo, s.Section, c.CertificateType,
                       c.Status, c.Remarks, c.UploadedAt, c.VerifiedAt
                FROM Certificates c
                JOIN Students s ON c.RollNo = s.RollNo
                ORDER BY s.Section, s.RollNo
            `;
        }

        const data = result.recordset;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        const fileName = section
            ? `Report_${section}.xlsx`
            : 'Complete_Report.xlsx';

        const filePath = `./${fileName}`;

        XLSX.writeFile(workbook, filePath);

        res.download(filePath);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Export failed' });
    }
};

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

exports.downloadCertificatesZip = async (req, res) => {
    try {
        const { section } = req.query;

        let result;

        if (section) {
            result = await sql.query`
                SELECT c.FilePath
                FROM Certificates c
                JOIN Students s ON c.RollNo = s.RollNo
                WHERE s.Section = ${section}
            `;
        } else {
            result = await sql.query`
                SELECT FilePath
                FROM Certificates
            `;
        }

        const files = result.recordset;

        if (files.length === 0) {
            return res.status(404).json({ message: 'No certificates found' });
        }

        const zipName = section
            ? `Certificates_${section}.zip`
            : 'All_Certificates.zip';

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        files.forEach(file => {
            const filePath = path.join(__dirname, '..', file.FilePath);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: path.basename(filePath) });
            }
        });

        await archive.finalize();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ZIP download failed' });
    }
};


exports.getAnalytics = async (req, res) => {
    try {
        // Overall counts
        const overall = await sql.query`
            SELECT 
                COUNT(*) AS Total,
                SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS Pending,
                SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) AS Approved,
                SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) AS Rejected
            FROM Certificates
        `;

        // Section-wise counts
        const sectionWise = await sql.query`
            SELECT s.Section, COUNT(*) AS SubmissionCount
            FROM Certificates c
            JOIN Students s ON c.RollNo = s.RollNo
            GROUP BY s.Section
            ORDER BY s.Section
        `;

        res.json({
            overall: overall.recordset[0],
            sectionWise: sectionWise.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Analytics failed' });
    }
};

exports.updateDeadline = async (req, res) => {
    try {
        let { newDeadline } = req.body;

        if (!newDeadline) {
            return res.status(400).json({ message: 'Deadline required' });
        }

        // Convert HTML datetime-local format
        newDeadline = new Date(newDeadline);

        const employeeId = req.session.user.employeeId;

        await sql.query`
            INSERT INTO Deadlines (SubmissionDeadline, IsLocked, UpdatedBy)
            VALUES (${newDeadline}, 0, ${employeeId})
        `;

        res.json({ message: 'Deadline updated successfully' });

    } catch (err) {
        console.error("Deadline Error:", err);
        res.status(500).json({ message: 'Deadline update failed' });
    }
};
