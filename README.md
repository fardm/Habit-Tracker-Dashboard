# Habit Tracker Dashboard

<div align="center">
  <img src="img/dashboard.webp" width="30%" />
  <img src="img/details-numeric.webp" width="30%" />
  <img src="img/details-boolean.webp" width="30%" />
</div>

An interactive Habit Tracker dashboard for Obsidian that visualizes habit data from your daily notes.

This is a **dashboard-only** plugin. It reads habit data from your daily notes' frontmatter based on your configured settings and provides visualizations, statistics, and progress tracking.

## Usage

### 1. Add Habit Data to Your Daily Notes

First, record your habits in the frontmatter of your daily notes.

```yaml
---
exercise: true
reading: 30
---
```

### 2. Create a Habit Tracker

Click the plugin icon in the ribbon, or run **"Habit Tracker Dashboard: Create new habit tracker"** from the Command Palette.

Enter a name for your tracker file and click **Create**.

### 3. Configure the Data Source

Open **Tracker Settings (⚙️)** and choose:

- Where your daily notes are located (Tag or Folder)
- How dates should be extracted (File name or Frontmatter)

### 4. Create Your Habits

Click **Add Habit** and create a habit that matches the frontmatter field in your daily notes.

For example:
- **Exercise** → Boolean
- **Reading** → Numeric

You can customize options such as target values, units, and visualization settings for numeric habits.


That's it! The dashboard will automatically read your daily notes.


## Features

- 📅 **Daily Dashboard and Date Navigation**: View all your habits for the current day with progress indicators, and browse different time periods with the date navigator

- 📊 **Full Yearly Reports**: Access comprehensive reports for any habit with detailed visualizations
- 🔥 **Calendar Heatmap**: GitHub-style heatmap showing habit consistency over the entire year
- 📈 **Line and Bar Charts**: Track trends and compare values over time with interactive line and bar charts
- 🔗 **Habit Streak Calculation**: Track current streak, longest streak, and streak history
- 📊 **Detailed Statistics**: Total, average, highest, lowest, completion rate.

<br>

## Settings & Behavior

### Refresh

If you edit your daily notes manually, click **Refresh (🔄)** to re-scan your notes and update the dashboard.


### Completion Condition

For **numeric habits**, choose when a habit is considered completed:

- **At least** (≥): Reach or exceed the target (e.g. 30+ minutes)
- **At most** (≤): Stay at or below the target (e.g. ≤2000 calories)
- **Exactly** (=): Match the target exactly

### Grace Days

Allow a streak to continue after a limited number of consecutive missed days.

- **0** = No missed days allowed; the streak resets immediately.
- **1+** = Allow the specified number of missed days before the streak resets.


### Minimum Streak Length

Only streaks with at least this many days are shown in **Streak History**.