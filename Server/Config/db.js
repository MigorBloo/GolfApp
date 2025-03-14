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
    connectionTimeoutMillis: 10000, // 10 seconds
    query_timeout: 10000,
    statement_timeout: 10000,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000
};

console.log('Database configuration (excluding password):', {
    ...dbConfig,
    password: '****'
});

const pool = new Pool(dbConfig);

// Add connection error handler
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Test the connection immediately
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to database');
        client.query('SELECT NOW()', (err, result) => {
            done();
            if (err) {
                console.error('Error running test query:', err);
            } else {
                console.log('Test query successful:', result.rows[0]);
            }
        });
    }
});

export default pool;