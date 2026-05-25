import fs from 'node:fs'
import path from 'node:path'
import { pool } from './pool.js'
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    const dir = path.join(__dirname, "migrations");
    const files : string[] = fs.readdirSync(dir).filter(file => file.endsWith('.sql')).sort();

    try {
        for(const file of files) {
            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            console.log(`Running migration: ${file}`);

            await pool.query(sql);
        }

        console.log("Migrations occurred without any fail");
    } finally {
        await pool.end();
    }
}

migrate().catch(err => {
    console.error("Migration failed", err);
    process.exit(1);
})
