// utils/db.ts
import mysql from 'mysql2/promise';


const pool = mysql.createPool({
    host: 'localhost',
    user: 'ptsims_dev',
    password: '',
    database: 'test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
