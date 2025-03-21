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
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000, // Increased to 30 seconds
    query_timeout: 30000,
    statement_timeout: 30000,
    max: 20,
    idleTimeoutMillis: 30000,
    retry: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000
    }
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

// Test the connection with retries
const testConnection = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            console.log('Test query successful:', result.rows[0]);
            return true;
        } catch (err) {
            console.error(`Connection attempt ${i + 1} failed:`, err.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${(i + 1) * 2} seconds...`);
                await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
            }
        }
    }
    throw new Error('Failed to connect to database after multiple attempts');
};

// Initialize the connection
testConnection().catch(err => {
    console.error('Failed to initialize database connection:', err);
    process.exit(1);
});

export default pool;