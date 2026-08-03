# Obsidian Habit Tracker Plugin

<div align="center">
  <img src="img/dashboard.webp" width="30%" />
  <img src="img/details-numeric.webp" width="30%" />
  <img src="img/details-boolean.webp" width="30%" />
</div>

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

## Usage

### Step 1: Configure Data Source

Open the Tracker Settings (⚙️ button) to define where your habit data should be extracted from:

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
   - **Completion Condition**: For numeric habits, choose when the habit counts as completed
   - **Visualization**: Choose how to display progress (Donut, Circle Check, or None)
   - **Color Theme**: Custom accent color for the habit
   - **Grace Days**: Number of missed days allowed before streak breaks

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

### Step 3: Track and View Reports

- **Daily Dashboard**: See your habits for the current day with progress indicators
- **Click on a habit**: Opens detailed reports with heatmap, charts, statistics, and streak information
- **Navigate dates**: Use the date navigator to view past days or future date

## Features

- 📅 **Daily Dashboard and Date Navigation**: View all your habits for the current day with progress indicators, and browse different time periods with the date navigator

- 📊 **Full Yearly Reports**: Access comprehensive reports for any habit with detailed visualizations
- 🔥 **Calendar Heatmap**: GitHub-style heatmap showing habit consistency over the entire year
- 📈 **Line and Bar Charts**: Track trends and compare values over time with interactive line and bar charts
- 🔗 **Habit Streak Calculation**: Track current streak, longest streak, and streak history
- 📊 **Detailed Statistics**: Total, average, highest, lowest, completion rate.
- 🎨 **Custom Colors**: Personalize each habit with a unique theme color
- 🌍 **Calendar System Support**: Choose between Gregorian or Solar Hijri (Jalali) calendar for reports

## How It Works

### The Refresh Button

The Refresh button (🔄) on the dashboard serves an important purpose:

**What problem it solves:**
The plugin automatically updates when you create, edit, or delete habits through the dashboard. However, if you manually edit your daily notes' frontmatter directly (outside of the plugin), the dashboard won't immediately reflect those changes.

**When to use it:**
- After manually adding or updating habit data in your daily notes
- After changing the data source settings
- If you notice the dashboard data seems outdated

**What it does:**
Clicking the Refresh button forces the plugin to re-scan your notes and rebuild the data cache, ensuring the dashboard displays the most up-to-date information from your vault.

## Advanced Settings Explanation

### Completion Condition (Numeric Habits)

For numeric habits, the Completion Condition determines when the habit counts as "completed" for streak calculations and statistics. Choose the option that best matches your goal:

- **At least**: The habit is completed when the value meets or exceeds the target.
  - *Example*: Target = 30 minutes. If you log 30 or more minutes, it counts as completed.
  - *Best for*: Habits where doing more is always better (exercise, reading, study time)

- **At most**: The habit is completed when the value is at or below the target.
  - *Example*: Target = 2000 calories. If you log 2000 or fewer calories, it counts as completed.
  - *Best for*: Habits where staying under a limit is the goal (calories, screen time, spending)

- **Exactly**: The habit is completed only when the value matches the target precisely.
  - *Example*: Target = 8 glasses. Only logging exactly 8 glasses counts as completed.
  - *Best for*: Habits with a precise target (medication doses, specific workout repetitions)

### Grace Days

Grace Days allow for occasional missed days without breaking your streak. This setting is useful for maintaining motivation while still tracking consistency.

**How it works:**
- If you set Grace Days to 1, you can miss 1 consecutive day without your streak breaking
- If you set Grace Days to 3, you can miss up to 3 consecutive days without your streak breaking
- Once you exceed the grace day limit, the streak resets

**When to use it:**
- Set to 0 for strict tracking (no missed days allowed)
- Set to 1-2 for realistic tracking (allows for occasional off days)
- Set higher values for flexible tracking during busy periods

### Report Calendar

Choose the calendar system used for habit reports and date displays:

- **Gregorian**: The standard Western calendar (January-December)
- **Solar Hijri (Jalali)**: The Persian/Iranian calendar system

This setting affects how dates are displayed in the heatmap, streak history, and other date-based visualizations.

### Minimum Streak Length for History

This setting filters which streaks appear in the Streak History section. Only streaks that meet or exceed this length will be shown.

- **Default**: 7 days
- **Purpose**: Keeps the history focused on meaningful streaks
- **Adjustment**: Increase to show only longer streaks, decrease to include shorter ones
