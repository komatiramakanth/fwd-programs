const sql = require('mssql');

const config = {
    user: 'moocsuser',
    password: 'Moocs@123',
    server: 'localhost',
    port: 1433,
    database: 'MOOCsPortalDB',
    options: {
        trustServerCertificate: true
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to SQL Server');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
}

module.exports = {
    sql,
    connectDB
};
