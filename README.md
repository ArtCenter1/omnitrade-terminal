# OmniTrade Terminal

A specialized terminal interface for the OmniTrade platform, providing advanced trading capabilities, real-time market data visualization, and AI-powered trading assistance. This terminal serves as the primary interface for traders to interact with the OmniTrade ecosystem.

## Key Features

- **Trading Bot Management:** Configure, deploy, and monitor various trading strategies (Grid, DCA, etc.).
- **User Dashboard:** Centralized view of portfolio allocation, bot performance, and overall account status.
- **Market Data Integration:** Real-time and historical market data visualization (charts, order books).
- **Exchange Connectivity:** Securely connect to multiple cryptocurrency exchanges via API.
- **OMNI Token Rewards:** Participate in staking and other programs to earn native platform tokens.
- **Modern UI/UX:** Built with React, TypeScript, and shadcn/ui for a clean and responsive user experience.

## Technology Stack

- **Frontend:** React, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Package Manager:** Bun
- **Linting/Formatting:** ESLint, Prettier
- **Testing:** Vitest (Configured via `vite.config.ts`)

## Project Structure

```
├── public/             # Static assets (favicon, etc.)
├── src/                # Main source code
│   ├── components/     # Reusable UI components (shadcn/ui, custom)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions, API clients
│   ├── pages/          # Page-level components/routes
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── docs/              # Essential documentation
├── project_management/ # Legacy planning docs, requirements
├── .github/workflows/  # CI/CD configuration
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Bun](https://bun.sh/) (Used as the primary package manager and runtime)

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ArtCenter1/omnitrade-terminal.git
    cd omnitrade-terminal
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Run the development server:**
    This will start the Vite development server, typically on `http://localhost:5173`.
    ```bash
    bun run dev
    ```

## Authentication Provider Setup

The OmniTrade platform now uses **Firebase** as the sole authentication provider.

- `VITE_AUTH_PROVIDER=firebase` is required in your `.env` file.

**Required environment variables:**

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

See the `.env` file for detailed placeholders and instructions.

## Environment Variables

The project uses two separate `.env` files for configuration:

1. **Root `.env`**: Contains frontend-specific variables (prefixed with `VITE_`)

   - Authentication configuration (Firebase)
   - Frontend API endpoints
   - UI configuration

2. **Backend `.env`** (in the `backend/` directory): Contains backend-specific variables
   - Database connection string
   - API keys for external services
   - Security settings (session secrets, encryption keys)
   - Backend-only configuration

This separation helps maintain a clear distinction between frontend and backend environments.

**Setting up your environment:**

1. Copy `.env.example` to `.env` in the project root
2. Copy `backend/.env.example` to `backend/.env`
3. Fill in the appropriate values in both files

**Note:** Both `.env` files are gitignored to prevent committing sensitive information.

## Migration Notes

- The platform has fully migrated from Supabase to Firebase for authentication.
- All Supabase code, configuration, and documentation have been removed.
- Future developers should review the `.env` file and authentication documentation before making changes.
- See `project_management/authentication_flow.md` for details on authentication flows and caveats.

## Available Scripts

- `bun run dev`: Starts the development server with hot reloading.
- `bun run build`: Builds the application for production in the `dist/` folder.
- `bun run lint`: Runs ESLint to check for code style issues.
- `bun run preview`: Serves the production build locally for preview.
- `bun test`: Runs the test suite using Vitest. (Note: Ensure tests are configured and written)

## Documentation

OmniTrade uses a hybrid documentation approach:

### In-Project Documentation

Essential documentation is available in the `/docs` directory:

- [Environment Setup](./docs/ENVIRONMENT_SETUP.md) - Quick guide to setting up the development environment
- [Coding Standards](./docs/CODING_STANDARDS.md) - Coding conventions and best practices
- [Architecture Overview](./docs/ARCHITECTURE.md) - High-level system architecture
- [UI Guidelines](./docs/UI_GUIDELINES.md) - Essential UI/UX guidelines and principles

### Comprehensive Documentation

For more detailed documentation, please visit our [GitHub Wiki](https://github.com/ArtCenter1/omnitrade-terminal/wiki).

### Project Management

For roadmap, sprint planning, and task tracking, please visit our [GitHub Projects](https://github.com/ArtCenter1/omnitrade-terminal/projects).

Legacy planning documents and design decisions are located in the `/project_management` directory.

## Contributing

We welcome contributions to the OmniTrade Terminal! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Relationship to OmniTrade Platform

The OmniTrade Terminal is a specialized component of the broader OmniTrade ecosystem. While it's maintained as a separate repository for focused development, it integrates with the core OmniTrade platform for authentication, data storage, and other shared services.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
