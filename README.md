# CareerPilot AI

An AI-powered career development platform that helps users analyze job descriptions, identify skill gaps, track their professional development, and organize their career journey.

**Live Demo:** [CareerPilot AI](https://careerpilot-ai-lovat.vercel.app)

**GitHub Repository:** [kiran7593/careerpilot-ai](https://github.com/kiran7593/careerpilot-ai)

## Features

- **Job Description Analysis** — Analyze job descriptions and identify relevant skills and requirements.
- **Skill Gap Analysis** — Compare detected job requirements with your existing skills.
- **Learning Recommendations** — Explore learning resources to help address identified skill gaps.
- **Saved Analyses** — Save, search, edit, compare, and export job analyses as PDF files.
- **Skill Development Roadmap** — Track missing skills and monitor progress through Not Started, In Progress, and Completed statuses.
- **User Authentication** — Register, sign in, and access personal career-development data.
- **Password Recovery** — Reset forgotten passwords through email-based recovery.
- **Persistent Data Storage** — Store user-specific analyses and skill progress in PostgreSQL.
- **Scheduled Maintenance** — Clean up expired rate-limit records through a protected cron endpoint.

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- jsPDF

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Resend for email delivery

### Testing and Development
- Vitest
- ESLint
- TypeScript
- Git and GitHub

### Deployment
- Vercel
- Neon PostgreSQL

## Application Architecture

CareerPilot AI uses a full-stack Next.js architecture.

- The frontend provides the user interface and career-development workflows.
- Next.js API routes handle authentication, analysis management, skill-status updates, and password recovery.
- Prisma ORM manages database access.
- PostgreSQL stores user accounts, saved analyses, and skill-development progress.
- Resend handles password-recovery emails.
- Vercel hosts the production application.

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL database
- Resend account for email functionality

### Installation

Clone the repository:

```bash
git clone https://github.com/kiran7593/careerpilot-ai.git
```

Navigate into the project:

```bash
cd careerpilot-ai
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and configure the following variables:

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
RESEND_API_KEY=
CRON_SECRET=
APP_URL=http://localhost:3000
```

Use your own credentials and secrets. Never commit your `.env` file or expose production credentials.

### Run Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm test` | Run the automated test suite |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Generate Prisma Client and build for production |

## Database

CareerPilot AI uses PostgreSQL with Prisma ORM.

Database schema changes are managed through Prisma migrations.

To apply existing migrations to a configured database:

```bash
npx prisma migrate deploy
```

## Testing

The project includes automated tests using Vitest.

The current test suite contains **116 passing tests** across 15 test files.

Run the test suite:

```bash
npm test
```

Additional quality checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

The application is deployed on Vercel and uses Neon PostgreSQL for database hosting.

Production environment variables must be configured securely in the Vercel project settings.

## Future Improvements

Potential areas for future enhancement include:

- Additional AI-powered career recommendations.
- More detailed skill-development insights.
- Expanded analytics and progress reporting.
- Further improvements to accessibility and user experience.

## Author

**Junior Web Developer**

GitHub: [@kiran7593](https://github.com/kiran7593)

