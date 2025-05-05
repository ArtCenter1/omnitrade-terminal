# OmniTrade Terminal - Showcase Branch

This branch contains a version of the OmniTrade Terminal that is specifically designed to showcase the UI and functionality without requiring a backend server. It uses mock data to demonstrate the interface and features.

## Purpose

The showcase branch serves several purposes:

1. **Demonstration**: It allows potential users and stakeholders to see the UI and functionality without needing to set up a backend server.
2. **GitHub Pages**: It is deployed to GitHub Pages for easy access and sharing.
3. **UI Testing**: It provides a consistent environment for testing UI components with predictable data.

## Features

The showcase version includes:

- Interactive trading terminal UI
- Mock market data visualization
- Draggable and resizable panels
- TabTrader-inspired layout
- Theme switching

## Limitations

Since this is a static showcase version, it has the following limitations:

- Uses mock data instead of real market data
- No actual trading functionality (simulated only)
- No authentication with real credentials
- No persistence between sessions (except for browser localStorage)

## Development

### Local Development

To run the showcase version locally:

```bash
# Clone the repository
git clone https://github.com/ArtCenter1/omnitrade-terminal.git

# Switch to the showcase branch
git checkout showcase

# Install dependencies
npm install

# Run the development server with mock data
VITE_USE_MOCK_API=true npm run dev
```

### Building

To build the showcase version:

```bash
npm run build:showcase
```

This will create a production build with mock data enabled.

### Deployment

The showcase branch is automatically deployed to GitHub Pages when changes are pushed to the branch. The deployment is handled by the GitHub Actions workflow defined in `.github/workflows/showcase-branch.yml`.

## Updating

When making changes to the main branch that should be reflected in the showcase:

1. Make and test your changes in the main branch
2. Switch to the showcase branch
3. Merge or cherry-pick the relevant changes from the main branch
4. Push the changes to trigger the GitHub Pages deployment

## Viewing the Showcase

The showcase version is available at: https://artcenter1.github.io/omnitrade-terminal/
