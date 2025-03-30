import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function runMigration() {
    const client = await pool.connect();
    try {
        const migrationPath = path.join(__dirname, 'migrations', '20240320_add_unique_constraint.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration...');
        await client.query(migrationSQL);
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration(); 