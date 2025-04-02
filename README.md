# OmniTrade Platform

OmniTrade is a comprehensive platform designed for automated cryptocurrency trading. It allows users to configure and manage trading bots, monitor market data, visualize portfolio performance, and participate in token reward programs.

## Key Features

*   **Trading Bot Management:** Configure, deploy, and monitor various trading strategies (Grid, DCA, etc.).
*   **User Dashboard:** Centralized view of portfolio allocation, bot performance, and overall account status.
*   **Market Data Integration:** Real-time and historical market data visualization (charts, order books).
*   **Exchange Connectivity:** Securely connect to multiple cryptocurrency exchanges via API.
*   **OMNI Token Rewards:** Participate in staking and other programs to earn native platform tokens.
*   **Modern UI/UX:** Built with React, TypeScript, and shadcn/ui for a clean and responsive user experience.

## Technology Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **Package Manager:** Bun
*   **Linting/Formatting:** ESLint, Prettier
*   **Testing:** Vitest (Configured via `vite.config.ts`)

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
├── project_management/ # Planning, design docs, requirements
├── .github/workflows/  # CI/CD configuration
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Bun](https://bun.sh/) (Used as the primary package manager and runtime)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd open-trade
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

## Available Scripts

*   `bun run dev`: Starts the development server with hot reloading.
*   `bun run build`: Builds the application for production in the `dist/` folder.
*   `bun run lint`: Runs ESLint to check for code style issues.
*   `bun run preview`: Serves the production build locally for preview.
*   `bun test`: Runs the test suite using Vitest. (Note: Ensure tests are configured and written)

## Project Management

Detailed planning, requirements, design documents, and architecture decisions are located in the `/project_management` directory.

## Contributing

(Contribution guidelines TBD)

## License

(License TBD)
