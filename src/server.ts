import * as dotenv from 'dotenv';
dotenv.config();

console.log("Recipe App server starting...");
console.log("Database URL:", process.env.DATABASE_URL);
console.log("Environment:", process.env.NODE_ENV || "development");

// This is just a placeholder until you implement your actual server
console.log("Server functionality will be implemented here");