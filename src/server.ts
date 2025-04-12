// src/server.ts
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log("Recipe App server starting...");
console.log("Database URL:", process.env.DATABASE_URL);
console.log("Environment:", process.env.NODE_ENV || "development");

// This is just a placeholder until you implement your actual server
console.log("Server functionality will be implemented here");