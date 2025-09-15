///// SERVER SIDE DATABASE BACKUP


// import path from 'path';
// import fs from 'fs';
// import mysql from 'mysql2';
// import xlsx from 'xlsx';
// import { exec } from 'child_process';
// import dotenv from 'dotenv';
// import nodemailer from 'nodemailer';
// import { fileURLToPath } from 'url';

// // Setup __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// // Backup directory for .sql files
// const backupDir = '/var/www/guru-goutham/db_backups';

// // Ensure SQL backup directory exists
// if (!fs.existsSync(backupDir)) {
//   fs.mkdirSync(backupDir, { recursive: true });
// }

// // Create timestamp string in desired format
// const getTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

// // Nodemailer transporter config
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: 'rajuking9160@gmail.com',
//     pass: 'ifye whlp asxl owhf',
//   },
// });

// // MySQL connection config
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// // List of tables to export to Excel
// const tables = ['users'];

// // Create SQL database backup file
// const createBackup = () => {
//   const timestamp = getTimestamp();
//   const sqlFileName = `${process.env.DB_NAME}-backup-${timestamp}.sql`;
//   const sqlFilePath = path.join(backupDir, sqlFileName);

//   const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} \
// --password=${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${sqlFilePath}"`;

//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.error('❌ SQL Backup failed:', error.message);
//       if (stderr) console.error('MySQL Error:', stderr);
//       return;
//     }

//     console.log(`✅ SQL Backup created: ${sqlFilePath}`);
//     convertSqlToExcelAndSend(timestamp);
//   });
// };

// // Convert selected table data to Excel (in memory) and send via email
// const convertSqlToExcelAndSend = (timestamp) => {
//   const wb = xlsx.utils.book_new();
//   let completedQueries = 0;

//   tables.forEach((table) => {
//     connection.query(`SELECT * FROM ${table}`, (err, results) => {
//       if (err) {
//         console.error(`❌ Error fetching data from ${table}:`, err.message);
//       } else {
//         const sheet = xlsx.utils.json_to_sheet(results);
//         xlsx.utils.book_append_sheet(wb, sheet, table);
//         console.log(`✅ Data from ${table} added to Excel`);
//       }

//       completedQueries++;

//       // After all queries complete
//       if (completedQueries === tables.length) {
//         // Write Excel file to buffer in memory
//         const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
//         console.log(`✅ Excel file generated in memory`);
//         sendBackupEmail(excelBuffer, timestamp);
//       }
//     });
//   });
// };

// // Send Excel backup via email (from buffer)
// const sendBackupEmail = (excelBuffer, timestamp) => {
//   const excelFileName = `${process.env.DB_NAME}-backup-${timestamp}.xlsx`;

//   const mailOptions = {
//     from: 'rajuking9160@gmail.com',
//     to: 'mulintiraju9160@gmail.com',
//     subject: '📦 Daily Database Backup (Excel)',
//     text: 'Attached is the latest database backup in Excel format.',
//     attachments: [
//       {
//         filename: excelFileName,
//         content: excelBuffer,
//         contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//       },
//     ],
//   };

//   transporter.sendMail(mailOptions, (err, info) => {
//     if (err) {
//       console.error('❌ Error sending backup email:', err.message);
//     } else {
//       console.log(`📧 Backup email sent successfully ✅`);
//     }
//   });
// };

// export default createBackup;







//LOCALLY BACKUP


import path from "path";
import fs from "fs";
import mysql from "mysql2";
import xlsx from "xlsx";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
    exec
} from "child_process";

dotenv.config();

// Absolute path for mysqldump executable
const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;

// Absolute path for backup directory
const backupDir = path.join(path.resolve(), "src", "utils", "db_backups");

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, {
        recursive: true
    });
}

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, // ✅ Correct
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


// Tables to include in backup
const tables = [
    "users"
];

// Send backup file via email
const sendBackupEmail = (filePath) => {
    const mailOptions = {
        from: "rajuking9160@gmail.com",
        to: "mulintiraju9160@gmail.com",
        subject: "📦 Daily Database Backup (Excel)",
        text: "Attached is the latest database backup in Excel format.",
        attachments: [{
            filename: path.basename(filePath),
            path: filePath,
        }, ],
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error("❌ Error sending backup email:", err.message);
        } else {
            console.log("📧 Backup email sent successfully ✅");
        }
    });
};

// Convert SQL data from all tables to Excel
const convertSqlToExcel = () => {
    const wb = xlsx.utils.book_new();

    tables.forEach((table) => {
        const query = `SELECT * FROM ${table}`;
        connection.query(query, (err, results) => {
            if (err) {
                console.error(`❌ Error querying ${table}:`, err.message);
                return;
            }
            const sheet = xlsx.utils.json_to_sheet(results);
            xlsx.utils.book_append_sheet(wb, sheet, table);
            console.log(`✅ ${table} data added to Excel`);
        });
    });

    setTimeout(() => {
        const excelFileName = `${process.env.DB_NAME}-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
        const excelFilePath = path.join(backupDir, excelFileName);

        xlsx.writeFile(wb, excelFilePath);
        console.log(`✅ Excel file created: ${excelFilePath}`);
        sendBackupEmail(excelFilePath);
    }, 2000);
};

// Create database backup
const createBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${process.env.DB_NAME}-backup-${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    const command = `${mysqldumpPath} -h ${process.env.DB_HOST} -u ${process.env.DB_USER} --password=${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Backup failed:", error.message);
            if (stderr) console.error("MySQL Error:", stderr);
            return;
        }
        console.log(`✅ SQL Backup created: ${filePath}`);
        convertSqlToExcel();
    });
};

export default createBackup;















//LOCALLY BACKUP DATABASE BACKUPS EVERYDAY


// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config(); // to load env variables

// const backupDir = path.join(__dirname, 'db_backups');

// if (!fs.existsSync(backupDir)) {
//   fs.mkdirSync(backupDir, { recursive: true });
// }

// const dbName = process.env.DB_NAME;
// const dbUser = process.env.DB_USER;
// const dbPassword = process.env.DB_PASSWORD;
// const dbHost = process.env.DB_HOST;

// // 👇 Replace with full path to mysqldump.exe
// const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;

// const createBackup = () => {
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//   const fileName = `${dbName}-backup-${timestamp}.sql`;
//   const filePath = path.join(backupDir, fileName);

//   // 👇 Updated to use full path
//   const command = `${mysqldumpPath} -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} > "${filePath}"`;

//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.error('❌ Error during DB backup:', error.message);
//       return;
//     }
//     console.log(`✅ Database backup created: ${filePath}`);
//   });
// };

// module.exports = { createBackup };




//// .SQL INTO GOOGLE SHEET CONVERT



// // Required modules
// const { google } = require('googleapis');
// const { JWT } = require('google-auth-library');
// const mysql = require('mysql2/promise');
// require('dotenv').config(); // load env variables

// // Load Google API credentials
// const credentials = require('../credentials.json'); // Adjust path if needed

// // Auth client for Google APIs
// const auth = new JWT({
//   email: credentials.client_email,
//   key: credentials.private_key,
//   scopes: [
//     'https://www.googleapis.com/auth/spreadsheets',
//     'https://www.googleapis.com/auth/drive'
//   ]
// });

// const sheets = google.sheets({ version: 'v4', auth });

// async function exportData() {
//   // Connect to MySQL database
//   const connection = await mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
//   });

//   const [tables] = await connection.execute("SHOW TABLES");

//   // Loop through each table in the database
//   for (let row of tables) {
//     const tableName = Object.values(row)[0];
//     const [rows, fields] = await connection.execute(`SELECT * FROM \`${tableName}\``);

//     // Prepare data for Google Sheet
//     const sheetData = [
//       fields.map(field => field.name), // header row
//       ...rows.map(row => fields.map(field => {
//         const value = row[field.name];
//         return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
//       }))
//     ];


//     // Create new sheet
//     const sheet = await sheets.spreadsheets.create({
//       resource: {
//         properties: { title: `Export - ${tableName}` },
//         sheets: [{ properties: { title: tableName } }]
//       }
//     });

//     const spreadsheetId = sheet.data.spreadsheetId;

//     // Populate sheet with data
//     await sheets.spreadsheets.values.update({
//       spreadsheetId,
//       range: `${tableName}!A1`,
//       valueInputOption: 'RAW',
//       resource: {
//         values: sheetData
//       }
//     });

//     console.log(`✅ Exported ${tableName} to Google Sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
//   }

//   await connection.end();
// }

// // Run export function
// exportData().catch(console.error);