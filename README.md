# Obsidian Habit Tracker Plugin

An interactive Habit Tracker plugin for Obsidian that creates a custom `.tracker` file type with a dedicated dashboard view.

## Project Structure

```
habit-tracker-plugin/
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── views/
│   │   └── trackerView.ts         # Custom view for .tracker files
│   └── handlers/
│       └── trackerFileHandler.ts  # File type registration handler
├── manifest.json                  # Plugin manifest
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── esbuild.config.mjs             # Build configuration
└── versions.json                  # Version compatibility
```

## Architecture

The plugin follows a modular architecture with separated responsibilities:

### Main Plugin (`src/main.ts`)
- Entry point for the plugin
- Handles plugin lifecycle (onload/onunload)
- Coordinates between different modules

### View Layer (`src/views/trackerView.ts`)
- Custom view implementation for `.tracker` files
- Extends `ItemView` from Obsidian API
- Responsible for rendering the dashboard UI

### Handler Layer (`src/handlers/trackerFileHandler.ts`)
- Registers the `.tracker` file extension
- Sets up the custom view type
- Handles cleanup on plugin unload

## Current Implementation

The plugin currently implements:

1. **Custom File Extension**: `.tracker` files are recognized by Obsidian
2. **Custom View**: Opening a `.tracker` file displays a custom dashboard view instead of the Markdown editor
3. **Ribbon Icon**: Quick access button to open the Habit Tracker view
4. **Scalable Architecture**: Modular structure ready for future expansion

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to build in development mode
4. Copy the plugin folder to your Obsidian vault's `.obsidian/plugins/` directory
5. Enable the plugin in Obsidian Settings > Community Plugins

## Development

- `npm run dev` - Build in watch mode for development
- `npm run build` - Build for production

## Future Features

The architecture is designed to support:

- **Habit Manager**: Create, edit, and delete habits
- **Widget System**: Reusable habit cards, heatmaps, charts
- **Data Layer**: Extract habit data from Markdown frontmatter
- **Statistics**: Streak calculation, progress analysis
- **Custom Layouts**: Flexible dashboard configurations

## Usage

1. Create a new file with `.tracker` extension (e.g., `Fitness.tracker`)
2. Open the file to see the custom Habit Tracker dashboard
3. Click the ribbon icon to open the tracker view in the sidebar
