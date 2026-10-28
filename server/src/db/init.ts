import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("ERROR: DATABASE_URL no esta definida en las variables de entorno.");
    process.exit(1);
}

const sql = postgres(connectionString);

async function initDB() {
    try {
        const schemaPath = join(import.meta.dir, "schema.sql");
        const schema = readFileSync(schemaPath, "utf-8");
        
        await sql.unsafe(schema);
        console.log("Base de datos inicializada correctamente.");

    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        process.exit(1);

    } finally {
        await sql.end();
    }
}

initDB();