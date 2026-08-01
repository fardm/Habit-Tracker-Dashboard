# Obsidian Habit Tracker Plugin

An interactive Habit Tracker dashboard for Obsidian that visualizes habit data extracted from your daily notes.

## About This Plugin

This plugin is a **dashboard-only** solution. It does not create or store daily habit data by itself. Instead, it extracts habit information from your Obsidian notes based on your configured settings and visualizes the progress.

You add your habit data inside your daily notes' frontmatter, and the plugin reads these notes to display comprehensive visualizations and statistics.

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to build in development mode
4. Copy the plugin folder to your Obsidian vault's `.obsidian/plugins/` directory
5. Enable the plugin in Obsidian Settings > Community Plugins

## How to Use

### Step 1: Configure Data Source

Open the plugin settings (⚙️ button) to define where your habit data should be extracted from:

**Data Source:**
- **Tag mode**: Filter notes by a specific tag (e.g., `#journal`)
- **Folder mode**: Search only within a specific folder path

**Date Extraction:**
- **From file name**: Extract dates from daily note filenames (e.g., `2024-01-15.md`)
- **From frontmatter property**: Extract dates from a custom frontmatter field (e.g., `date: 2024-01-15`)

### Step 2: Create Habits

1. Click the "Add Habit" button on the dashboard
2. Configure your habit:
   - **Name**: Display name for the habit
   - **Emoji**: Visual identifier
   - **Type**: Boolean (done/not done) or Numeric (with values)
   - **Frontmatter Field**: The property name used in your daily notes
   - **Unit**: For numeric habits (e.g., "minutes", "pages")
   - **Target**: Optional target value for numeric habits
   - **Visualization**: Choose how to display progress (Donut, Progress Bar, Circle Check, or None)
   - **Color Theme**: Custom accent color for the habit

3. Add the habit data to your daily notes' frontmatter:

**Example for Boolean Habit:**
```yaml
---
reading: true
---
```

**Example for Numeric Habit:**
```yaml
---
exercise_minutes: 30
---
```

The plugin will read these daily notes and visualize your progress on the dashboard.

## Features

### GitHub-style Calendar Heatmap
Visualize your habit consistency over time with an interactive heatmap similar to GitHub's contribution graph. See at a glance which days you completed your habits and identify patterns in your behavior.

### Charts
Track habit progress with visual charts that support different views:
- **Line Charts**: Show trends over time
- **Bar Charts**: Compare values across periods
- **Donut Charts**: Display completion percentages
- **Progress Bars**: Visual progress toward targets

### Statistics & Reports
Get comprehensive metrics about your habits:
- **Total**: Sum of all values
- **Average**: Mean value over the selected period
- **Highest**: Maximum value achieved
- **Lowest**: Minimum value recorded
- **Completion Rate**: Percentage of days with activity

### Streak Tracking
Monitor your consistency with detailed streak information:
- **Current Streak**: How many consecutive days you've maintained the habit
- **Longest Streak**: Your best streak ever
- **Streak History**: View past streaks and their durations

### Customizable Dashboard
- **Grid or List View**: Choose your preferred layout
- **Date Navigation**: Browse different time periods
- **Time Range Filters**: View data for specific ranges (last 30 days, last 90 days, etc.)
- **Habit Reordering**: Drag and drop habits to organize your dashboard
- **Custom Colors**: Personalize each habit with a unique theme color

## Development

- `npm run dev` - Build in watch mode for development
- `npm run build` - Build for production
