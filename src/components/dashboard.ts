import { App, TFile } from "obsidian";
import { HTMLElementComponent } from "./htmlElementComponent";
import { AddHabitButton } from "./addHabitButton";
import { RefreshButton } from "./refreshButton";
import { SettingsButton } from "./settingsButton";
import { HabitCard, HabitCardProps } from "./habitCard";
import { HabitModal, HabitFormData } from "./habitModal";
import { HabitDataManager } from "../handlers/habitDataManager";
import { FrontmatterDataReader } from "../handlers/frontmatterDataReader";
import { DateNavigator } from "./dateNavigator";
import { ViewModeSwitcher } from "./viewModeSwitcher";
import { Habit, HabitType, ViewMode, TrackerSettings } from "../types/habitTypes";
import { HabitDetailsModal } from "./habitDetails/habitDetailsModal";
import { SettingsModal, SettingsFormData } from "./settingsModal";

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
	private currentDate: Date;
	private currentViewMode: ViewMode;
	private container?: HTMLElement;
	private dateNavigator?: DateNavigator;
	private viewModeSwitcher?: ViewModeSwitcher;
	private draggedHabitId?: string;
	private dropIndicator?: HTMLElement;
	private currentSettings: TrackerSettings = {};

	constructor(app: App, file: TFile) {
		super();
		this.app = app;
		this.file = file;
		this.dataManager = new HabitDataManager(app.vault, file);
		this.frontmatterReader = new FrontmatterDataReader(app, this.currentSettings);
		this.currentDate = new Date(); // Default to today
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
			justify-content: space-between;
			margin-bottom: 20px;
			gap: 16px;
		`;

		// Left side: Settings button, Add Habit button and Refresh button
		const leftControls = document.createElement("div");
		leftControls.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
		`;
		
		const settingsButton = new SettingsButton(() => {
			this.showSettingsModal();
		});
		leftControls.appendChild(settingsButton.render());
		
		const addHabitButton = new AddHabitButton(() => {
			this.showAddHabitModal();
		});
		leftControls.appendChild(addHabitButton.render());

		const refreshButton = new RefreshButton(() => {
			this.refresh();
		});
		leftControls.appendChild(refreshButton.render());

		// Center: Date navigator
		const centerControls = document.createElement("div");
		centerControls.style.cssText = `
			display: flex;
			align-items: center;
		`;
		
		this.dateNavigator = new DateNavigator(this.currentDate, (date) => {
			this.handleDateChange(date);
		});
		centerControls.appendChild(this.dateNavigator.render());

		// Right side: View mode switcher
		const rightControls = document.createElement("div");
		rightControls.style.cssText = `
			display: flex;
			align-items: center;
		`;
		
		this.viewModeSwitcher = new ViewModeSwitcher({
			currentMode: this.currentViewMode,
			onModeChange: (mode) => this.handleViewModeChange(mode)
		});
		rightControls.appendChild(this.viewModeSwitcher.render());

		controlsRow.appendChild(leftControls);
		controlsRow.appendChild(centerControls);
		controlsRow.appendChild(rightControls);

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
				grid-template-columns: repeat(2, 1fr);
				gap: 16px;
			`;
			// Add responsive breakpoint for smaller screens
			const style = document.createElement("style");
			style.textContent = `
				@media (max-width: 768px) {
					.habits-container {
						grid-template-columns: 1fr !important;
					}
				}
			`;
			container.appendChild(style);
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
				this.currentSettings = data.settings;
				
				// Load view mode if saved
				this.currentViewMode = data.settings.viewMode || ViewMode.GRID;
				
				// Load selected date if saved
				if (data.settings.selectedDate) {
					this.currentDate = new Date(data.settings.selectedDate);
				}
			}
		} catch (error) {
			console.error("Error loading user settings:", error);
		}
	}

	private async saveUserSettings(): Promise<void> {
		try {
			const data = await this.dataManager.readTrackerData();
			data.settings = {
				...this.currentSettings,
				viewMode: this.currentViewMode,
				selectedDate: this.currentDate.toISOString().split('T')[0] // Store as YYYY-MM-DD
			};
			await this.dataManager.writeTrackerData(data);
		} catch (error) {
			console.error("Error saving user settings:", error);
		}
	}

	private async handleSaveSettings(formData: SettingsFormData): Promise<void> {
		try {
			this.currentSettings = {
				...this.currentSettings,
				dataSourceType: formData.dataSourceType,
				dataSourceValue: formData.dataSourceValue,
				dateExtractionMethod: formData.dateExtractionMethod,
				dateFrontmatterProperty: formData.dateFrontmatterProperty
			};
			
			// Update frontmatter reader with new settings
			this.frontmatterReader.updateSettings(this.currentSettings);
			
			const data = await this.dataManager.readTrackerData();
			data.settings = this.currentSettings;
			await this.dataManager.writeTrackerData(data);
			
			// Reload habit values with new settings
			await this.loadHabitValues();
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error saving settings:", error);
		}
	}

	private async loadHabits(): Promise<void> {
		try {
			this.habits = await this.dataManager.getHabits();
			// Sort habits by order property
			this.habits.sort((a, b) => {
				const orderA = a.order ?? 999;
				const orderB = b.order ?? 999;
				return orderA - orderB;
			});
		} catch (error) {
			console.error("Error loading habits:", error);
			this.habits = [];
		}
	}

	private async loadHabitValues(): Promise<void> {
		try {
			// Clear previous values to ensure we only show data for the current date
			this.habitValues.clear();
			
			// Calculate start and end of the selected day
			const startOfDay = new Date(this.currentDate);
			startOfDay.setHours(0, 0, 0, 0);
			
			const endOfDay = new Date(this.currentDate);
			endOfDay.setHours(23, 59, 59, 999);
			
			for (const habit of this.habits) {
				const latestValue = await this.frontmatterReader.getLatestHabitValue(
					habit,
					startOfDay,
					endOfDay
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
				pointer-events: none;
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
				onDelete: (habitId) => this.handleDeleteHabit(habitId),
				onClick: (habitId) => this.handleHabitClick(habitId),
				onDragStart: (habitId, event) => this.handleDragStart(habitId, event),
				onDragOver: (event) => this.handleDragOver(event),
				onDrop: (habitId, event) => this.handleDrop(habitId, event),
				onDragEnd: () => this.handleDragEnd()
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

	private showSettingsModal(): void {
		const modal = new SettingsModal(
			this.app,
			async (formData: SettingsFormData) => {
				await this.handleSaveSettings(formData);
			},
			this.currentSettings
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
				visualization: formData.visualization,
				themeColor: formData.themeColor
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
				visualization: habit.visualization,
				themeColor: habit.themeColor
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
				visualization: formData.visualization,
				themeColor: formData.themeColor
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

	private async handleDateChange(date: Date): Promise<void> {
		this.currentDate = date;
		await this.saveUserSettings();
		await this.loadHabitValues();
		
		if (this.container) {
			this.renderHabits(this.container);
		}
	}

	private handleHabitClick(habitId: string): void {
		const habit = this.habits.find(h => h.id === habitId);
		if (!habit) return;

		const modal = new HabitDetailsModal(this.app, {
			habitId: habit.id,
			habitName: habit.name,
			habitEmoji: habit.emoji,
			habitType: habit.type,
			unit: habit.unit,
			target: habit.target,
			trackerSettings: this.currentSettings,
			onClose: async () => {
				modal.close();
				// Reload habits to pick up any theme color changes
				await this.loadHabits();
				if (this.container) {
					this.renderHabits(this.container);
				}
			}
		}, habit);
		modal.open();
	}

	private async handleViewModeChange(mode: ViewMode): Promise<void> {
		this.currentViewMode = mode;
		await this.saveUserSettings();
		
		// Update view mode switcher active state
		if (this.viewModeSwitcher) {
			this.viewModeSwitcher.updateCurrentMode(this.currentViewMode);
		}
		
		if (this.container) {
			this.updateContainerLayout(this.container);
			this.renderHabits(this.container);
		}
	}

	private handleDragStart(habitId: string, event: DragEvent): void {
		this.draggedHabitId = habitId;
		event.dataTransfer!.setData("text/plain", habitId);
	}

	private handleDragOver(event: DragEvent): void {
		event.preventDefault();
		event.dataTransfer!.dropEffect = "move";

		// Show drop indicator
		const target = event.target as HTMLElement;
		const card = target.closest('.habit-card') as HTMLElement;
		if (card && this.container) {
			this.showDropIndicator(card);
		}
	}

	private async handleDrop(targetHabitId: string, event: DragEvent): Promise<void> {
		event.preventDefault();
		this.hideDropIndicator();

		if (!this.draggedHabitId || this.draggedHabitId === targetHabitId) {
			return;
		}

		const draggedIndex = this.habits.findIndex(h => h.id === this.draggedHabitId);
		const targetIndex = this.habits.findIndex(h => h.id === targetHabitId);

		if (draggedIndex === -1 || targetIndex === -1) {
			return;
		}

		// Reorder habits array
		const [draggedHabit] = this.habits.splice(draggedIndex, 1);
		this.habits.splice(targetIndex, 0, draggedHabit);

		// Update order values for all habits
		this.habits.forEach((habit, index) => {
			habit.order = index;
		});

		// Save the new order
		await this.saveHabitOrder();

		// Re-render
		if (this.container) {
			this.renderHabits(this.container);
		}
	}

	private handleDragEnd(): void {
		this.draggedHabitId = undefined;
		this.hideDropIndicator();
	}

	private showDropIndicator(targetCard: HTMLElement): void {
		this.hideDropIndicator();

		if (!this.container) return;

		const indicator = document.createElement("div");
		indicator.className = "drop-indicator";
		indicator.style.cssText = `
			height: 3px;
			background-color: var(--interactive-accent);
			border-radius: 2px;
			margin: 4px 0;
			transition: all 0.2s ease;
		`;

		// Insert indicator before the target card
		targetCard.parentNode?.insertBefore(indicator, targetCard);
		this.dropIndicator = indicator;
	}

	private hideDropIndicator(): void {
		if (this.dropIndicator) {
			this.dropIndicator.remove();
			this.dropIndicator = undefined;
		}
	}

	private async saveHabitOrder(): Promise<void> {
		try {
			const data = await this.dataManager.readTrackerData();
			data.habits = this.habits;
			await this.dataManager.writeTrackerData(data);
		} catch (error) {
			console.error("Error saving habit order:", error);
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