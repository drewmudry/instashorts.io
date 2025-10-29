# InstaShorts

A Next.js application with PostgreSQL and Drizzle ORM.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and pnpm installed

### Setup

1. **Start the PostgreSQL database:**

```bash
docker-compose up -d
```

This will start PostgreSQL in the background.

2. **Install dependencies:**

```bash
pnpm install
```

3. **Push the database schema:**

```bash
pnpm db:push
```

Or if you prefer using migrations:

```bash
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply migrations
```

4. **Start the development server:**

```bash
pnpm dev
```

Your app will be running at [http://localhost:3000](http://localhost:3000)

### Database Management

The project uses Drizzle ORM for database management. Here are the available commands:

- **Generate migrations** (after changing schema):
  ```bash
  pnpm db:generate
  ```

- **Run migrations**:
  ```bash
  pnpm db:migrate
  ```

- **Push schema directly** (for development):
  ```bash
  pnpm db:push
  ```

- **Open Drizzle Studio** (visual database browser):
  ```bash
  pnpm db:studio
  ```

### Environment Variables

The `.env.local` file is already configured with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/instashorts
```

This connects to the PostgreSQL database running in Docker.

## Project Structure

- `src/app/` - Next.js app directory
- `src/db/` - Database configuration and schema
  - `schema.ts` - Drizzle schema definitions
  - `index.ts` - Database connection
- `src/actions/` - Server actions
- `drizzle.config.ts` - Drizzle Kit configuration
- `docker-compose.yml` - PostgreSQL database configuration

## Useful Commands

**Database:**
- `docker-compose up -d` - Start PostgreSQL
- `docker-compose down` - Stop PostgreSQL
- `docker-compose down -v` - Stop PostgreSQL and delete data

**Development:**
- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

## Server Actions Demo

The homepage demonstrates a basic server action that:
- Fetches all users from the database
- Creates new users via a form submission

Server actions are defined in `src/actions/user-actions.ts` and use the `'use server'` directive.

## Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL 15
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
