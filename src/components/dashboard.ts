import { App, TFile } from "obsidian";
import { HTMLElementComponent } from "./htmlElementComponent";
import { AddHabitButton } from "./addHabitButton";
import { HabitCard, HabitCardProps } from "./habitCard";
import { HabitModal, HabitFormData } from "./habitModal";
import { HabitDataManager } from "../handlers/habitDataManager";
import { FrontmatterDataReader } from "../handlers/frontmatterDataReader";
import { DateRangeFilter } from "./dateRangeFilter";
import { ViewModeSwitcher } from "./viewModeSwitcher";
import { Habit, HabitType, DateRangeFilter as DateRangeFilterEnum, ViewMode } from "../types/habitTypes";
import { getDateRange } from "../utils/dateUtils";

/**
 * Main Dashboard component that displays the habit tracker interface
 */
export class Dashboard extends HTMLElementComponent {
	private app: App;
	private file: TFile;
	private dataManager: HabitDataManager;
	private frontmatterReader: FrontmatterDataReader;
	private habits: Habit[] = [];
	private habitValues: Map<string, boolean | number> = new Map();
	private container?: HTMLElement;
	private currentFilter: DateRangeFilterEnum = DateRangeFilterEnum.TODAY;
	private currentViewMode: ViewMode = ViewMode.GRID;
	private dateRangeFilter?: DateRangeFilter;
	private viewModeSwitcher?: ViewModeSwitcher;

	constructor(app: App, file: TFile) {
		super();
		this.app = app;
		this.file = file;
		this.dataManager = new HabitDataManager(app.vault, file);
		this.frontmatterReader = new FrontmatterDataReader(app);
	}

	render(): HTMLElement {
		const dashboard = document.createElement("div");
		dashboard.className = "habit-tracker-dashboard";
		
		// Dashboard styling
		dashboard.style.cssText = `
			padding: 20px;
			max-width: 1200px;
			margin: 0 auto;
		`;

		// Controls row
		const controlsRow = document.createElement("div");
		controlsRow.className = "dashboard-controls";
		controlsRow.style.cssText = `
			display: flex;
			align-items: center;
			margin-bottom: 20px;
			flex-wrap: wrap;
			gap: 12px;
		`;

		// Add Habit button
		const addHabitButton = new AddHabitButton(() => {
			this.showAddHabitModal();
		});
		controlsRow.appendChild(addHabitButton.render());

		// Date range filter
		this.dateRangeFilter = new DateRangeFilter({
			currentFilter: this.currentFilter,
			onFilterChange: (filter) => this.handleFilterChange(filter)
		});
		controlsRow.appendChild(this.dateRangeFilter.render());

		// View mode switcher
		this.viewModeSwitcher = new ViewModeSwitcher({
			currentMode: this.currentViewMode,
			onModeChange: (mode) => this.handleViewModeChange(mode)
		});
		controlsRow.appendChild(this.viewModeSwitcher.render());

		dashboard.appendChild(controlsRow);

		// Habits container
		const habitsContainer = document.createElement("div");
		habitsContainer.className = "habits-container";
		habitsContainer.style.cssText = `
			margin-top: 16px;
		`;

		// Apply grid or list layout based on view mode
		this.updateContainerLayout(habitsContainer);

		// Store reference for updates
		this.container = habitsContainer;

		dashboard.appendChild(habitsContainer);

		return dashboard;
	}

	private updateContainerLayout(container: HTMLElement): void {
		if (this.currentViewMode === ViewMode.GRID) {
			container.style.cssText = `
				margin-top: 16px;
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 16px;
			`;
		} else {
			container.style.cssText = `
				margin-top: 16px;
				display: flex;
				flex-direction: column;
				gap: 12px;
			`;
		}
	}

	async initialize(): Promise<void> {
		// Load settings from file first, before loading habits
		await this.loadUserSettings();
		await this.loadHabits();
		await this.loadHabitValues();
		
		// Re-render the entire dashboard with loaded settings
		if (this.container) {
			const dashboard = this.container.parentElement;
			if (dashboard) {
				dashboard.empty();
				const newDashboard = this.render();
				dashboard.appendChild(newDashboard);
				this.container = newDashboard.querySelector('.habits-container') as HTMLElement;
				this.renderHabits(this.container);
			}
		}
	}

	private async loadUserSettings(): Promise<void> {
		try {
			const data = await this.dataManager.readTrackerData();
			if (data.settings) {
				this.currentFilter = data.settings.dateRangeFilter || DateRangeFilterEnum.TODAY;
				this.currentViewMode = data.settings.viewMode || ViewMode.GRID;
			}
		} catch (error) {
			console.error("Error loading user settings:", error);
		}
	}

	private async saveUserSettings(): Promise<void> {
		try {
			const data = await this.dataManager.readTrackerData();
			data.settings = {
				dateRangeFilter: this.currentFilter,
				viewMode: this.currentViewMode
			};
			await this.dataManager.writeTrackerData(data);
		} catch (error) {
			console.error("Error saving user settings:", error);
		}
	}

	private async loadHabits(): Promise<void> {
		try {
			this.habits = await this.dataManager.getHabits();
		} catch (error) {
			console.error("Error loading habits:", error);
			this.habits = [];
		}
	}

	private async loadHabitValues(): Promise<void> {
		try {
			const dateRange = getDateRange(this.currentFilter);
			
			for (const habit of this.habits) {
				const latestValue = await this.frontmatterReader.getLatestHabitValue(
					habit,
					dateRange.start,
					dateRange.end
				);
				if (latestValue && latestValue.value !== undefined) {
					this.habitValues.set(habit.id, latestValue.value);
				}
			}
		} catch (error) {
			console.error("Error loading habit values:", error);
		}
	}

	private renderHabits(container: HTMLElement): void {
		container.empty();

		if (this.habits.length === 0) {
			const emptyState = document.createElement("div");
			emptyState.className = "empty-state";
			emptyState.textContent = "No habits yet. Click 'Add Habit' to create your first habit!";
			emptyState.style.cssText = `
				text-align: center;
				padding: 40px 20px;
				color: var(--text-muted);
				font-style: italic;
			`;
			container.appendChild(emptyState);
			return;
		}

		this.habits.forEach(habit => {
			const habitCard = new HabitCard({
				habit: habit,
				currentValue: this.habitValues.get(habit.id),
				viewMode: this.currentViewMode,
				onEdit: (habitId) => this.handleEditHabit(habitId),
				onDuplicate: (habitId) => this.handleDuplicateHabit(habitId),
				onDelete: (habitId) => this.handleDeleteHabit(habitId)
			});
			container.appendChild(habitCard.render());
		});
	}

	private showAddHabitModal(): void {
		const modal = new HabitModal(
			this.app,
			async (formData: HabitFormData) => {
				await this.handleAddHabit(formData);
			}
		);
		modal.open();
	}

	private async handleAddHabit(formData: HabitFormData): Promise<void> {
		try {
			const newHabit = await this.dataManager.addHabit({
				name: formData.name,
				emoji: formData.emoji,
				type: formData.type,
				frontmatterField: formData.frontmatterField,
				unit: formData.unit,
				target: formData.target,
				visualization: formData.visualization
			});

			this.habits.push(newHabit);
			await this.loadHabitValues();
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error adding habit:", error);
		}
	}

	private handleEditHabit(habitId: string): void {
		const habit = this.habits.find(h => h.id === habitId);
		if (!habit) return;

		const modal = new HabitModal(
			this.app,
			async (formData: HabitFormData) => {
				await this.handleUpdateHabit(habitId, formData);
			},
			{
				name: habit.name,
				emoji: habit.emoji,
				type: habit.type,
				frontmatterField: habit.frontmatterField,
				unit: habit.unit,
				target: habit.target,
				visualization: habit.visualization
			}
		);
		modal.open();
	}

	private async handleUpdateHabit(habitId: string, formData: HabitFormData): Promise<void> {
		try {
			await this.dataManager.updateHabit(habitId, {
				name: formData.name,
				emoji: formData.emoji,
				type: formData.type,
				frontmatterField: formData.frontmatterField,
				unit: formData.unit,
				target: formData.target,
				visualization: formData.visualization
			});

			await this.loadHabits();
			await this.loadHabitValues();
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error updating habit:", error);
		}
	}

	private async handleDuplicateHabit(habitId: string): Promise<void> {
		try {
			const habit = this.habits.find(h => h.id === habitId);
			if (!habit) return;

			const newHabit = await this.dataManager.addHabit({
				name: `${habit.name} (copy)`,
				emoji: habit.emoji,
				type: habit.type,
				frontmatterField: `${habit.frontmatterField}_copy`,
				unit: habit.unit,
				target: habit.target,
				visualization: habit.visualization
			});

			this.habits.push(newHabit);
			await this.loadHabitValues();
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error duplicating habit:", error);
		}
	}

	private async handleDeleteHabit(habitId: string): Promise<void> {
		try {
			await this.dataManager.removeHabit(habitId);
			this.habits = this.habits.filter(h => h.id !== habitId);
			this.habitValues.delete(habitId);
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error deleting habit:", error);
		}
	}

	private async handleFilterChange(filter: DateRangeFilterEnum): Promise<void> {
		this.currentFilter = filter;
		await this.saveUserSettings();
		await this.loadHabitValues();
		
		if (this.container) {
			this.renderHabits(this.container);
		}
	}

	private async handleViewModeChange(mode: ViewMode): Promise<void> {
		this.currentViewMode = mode;
		await this.saveUserSettings();
		
		if (this.container) {
			this.updateContainerLayout(this.container);
			this.renderHabits(this.container);
		}
	}

	/**
	 * Refreshes the dashboard by reloading habits from the file
	 */
	async refresh(): Promise<void> {
		await this.loadHabits();
		await this.loadUserSettings();
		await this.loadHabitValues();
		if (this.container) {
			this.renderHabits(this.container);
		}
	}
}