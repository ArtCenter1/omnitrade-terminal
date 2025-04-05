# Database Migrations System

This directory contains the database schema and migrations for the OmniTrade platform.

## Overview

We use [Prisma](https://www.prisma.io/) as our ORM (Object-Relational Mapping) tool to:
- Define the database schema
- Generate type-safe database client
- Manage database migrations
- Seed the database with initial data

## Files

- `schema.prisma`: The main schema file that defines the database models and relationships
- `migrations/`: Directory containing all migration files
- `seed.js`: Script to seed the database with initial data

## Database Setup

The project is configured to use SQLite for development and testing. In production, you would typically use PostgreSQL or another production-ready database.

### Environment Variables

Make sure you have the following in your `.env` file:

```
DATABASE_URL="file:./dev.db"  # For SQLite
# Or for PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/omnitrade?schema=public"
```

## Migration Commands

We've added several npm scripts to manage the database:

```bash
# Run pending migrations
npm run db:migrate

# Create a new migration
npm run db:create <migration-name>

# Reset the database (drop all tables and recreate)
npm run db:reset

# Seed the database with initial data
npm run db:seed

# Open Prisma Studio to view and edit data
npm run db:studio

# Check migration status
npm run db:status
```

## Creating a New Migration

When you make changes to the `schema.prisma` file, you need to create a new migration:

```bash
npm run db:create add-new-feature
```

This will:
1. Compare your current schema with the database
2. Generate a migration file with the necessary SQL
3. Apply the migration to your database
4. Update the Prisma client

## Seeding the Database

To populate the database with initial data:

```bash
npm run db:seed
```

This will run the `seed.js` script, which creates:
- Default exchanges
- A test user (for development only)

## Prisma Studio

To visually explore and edit your database:

```bash
npm run db:studio
```

This will open Prisma Studio in your browser, where you can view and edit your data.

## Best Practices

1. **Never edit migration files** after they've been committed
2. Create small, focused migrations
3. Test migrations thoroughly before deploying
4. Use transactions for complex migrations
5. Back up your database before applying migrations in production
