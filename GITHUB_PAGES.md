# OmniTrade Terminal - GitHub Pages Demo

This is a static demo version of the OmniTrade Terminal deployed on GitHub Pages. This version demonstrates the UI and functionality using mock data, without requiring a backend server.

## Features Available in This Demo

- Interactive trading terminal UI
- Mock market data visualization
- Draggable and resizable panels
- TabTrader-inspired layout
- Theme switching

## Limitations of This Demo

Since this is a static GitHub Pages deployment, it has the following limitations:

- Uses mock data instead of real market data
- No actual trading functionality (simulated only)
- No authentication with real credentials
- No persistence between sessions (except for browser localStorage)

## Full Version

For the full version with all features and real-time data, please:

1. Clone the repository: `git clone https://github.com/ArtCenter1/omnitrade-terminal.git`
2. Install dependencies: `npm install` or `bun install`
3. Run the development server: `npm run dev` or `bun run dev`

## Development

This GitHub Pages demo is automatically built and deployed from the `main` branch using GitHub Actions. The workflow file is located at `.github/workflows/gh-pages.yml`.

To update this demo:

1. Make changes to the codebase
2. Commit and push to the `main` branch
3. GitHub Actions will automatically build and deploy the updated version

## Contact

For questions or support, please open an issue on the [GitHub repository](https://github.com/ArtCenter1/omnitrade-terminal/issues).
