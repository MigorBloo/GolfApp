import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('Initializing database configuration...');

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    connectionTimeoutMillis: 5000, // Reduced to 5 seconds for faster feedback
    max: 20,
    idleTimeoutMillis: 30000
};

console.log('Database configuration (excluding password):', {
    ...dbConfig,
    password: '****'
});

export const pool = new Pool(dbConfig);

// Add connection error handler
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Test the connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection successful:', result.rows[0]);
        return true;
    } catch (err) {
        console.error('Failed to connect to database:', err.message);
        throw err;
    }
};

// Initialize the connection
testConnection().catch(err => {
    console.error('Failed to initialize database connection:', err);
    process.exit(1);
});

export default pool;