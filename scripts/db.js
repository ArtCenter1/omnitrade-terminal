#!/usr/bin/env node

/**
 * Database management script
 *
 * This script provides commands for managing the database:
 * - migrate: Run migrations to update the database schema
 * - reset: Reset the database (drop all tables and recreate)
 * - seed: Seed the database with initial data
 * - studio: Open Prisma Studio to view and edit data
 *
 * Usage:
 *   node scripts/db.js [command]
 *
 * Commands:
 *   migrate  - Run pending migrations
 *   create   - Create a new migration
 *   reset    - Reset the database (drop all tables and recreate)
 *   seed     - Seed the database with initial data
 *   studio   - Open Prisma Studio to view and edit data
 *   status   - Show migration status
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, "..");
process.chdir(projectRoot);

// Check if .env file exists
if (!fs.existsSync(path.join(projectRoot, ".env"))) {
  console.error(
    "Error: .env file not found. Please create one with DATABASE_URL defined."
  );
  process.exit(1);
}

// Get command from arguments
const command = process.argv[2];

// Execute Prisma command with proper error handling
function runPrismaCommand(command) {
  try {
    execSync(`npx prisma ${command}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing command: npx prisma ${command}`);
    process.exit(1);
  }
}

// Handle commands
switch (command) {
  case "migrate":
    console.log("Running database migrations...");
    runPrismaCommand("migrate dev");
    break;

  case "create":
    const migrationName = process.argv[3];
    if (!migrationName) {
      console.error("Error: Migration name is required.");
      console.log("Usage: node scripts/db.js create <migration-name>");
      process.exit(1);
    }
    console.log(`Creating migration: ${migrationName}...`);
    runPrismaCommand(`migrate dev --name ${migrationName}`);
    break;

  case "reset":
    console.log("Resetting database...");
    runPrismaCommand("migrate reset --force");
    break;

  case "seed":
    console.log("Seeding database...");
    runPrismaCommand("db seed");
    break;

  case "studio":
    console.log("Opening Prisma Studio...");
    runPrismaCommand("studio");
    break;

  case "status":
    console.log("Checking migration status...");
    runPrismaCommand("migrate status");
    break;

  default:
    console.log(`
Database Management Script

Usage:
  node scripts/db.js [command]

Commands:
  migrate  - Run pending migrations
  create   - Create a new migration (requires name: node scripts/db.js create <name>)
  reset    - Reset the database (drop all tables and recreate)
  seed     - Seed the database with initial data
  studio   - Open Prisma Studio to view and edit data
  status   - Show migration status
`);
    break;
}
