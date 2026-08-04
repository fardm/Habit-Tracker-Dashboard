import { App, TFile } from "obsidian";
import { HTMLElementComponent } from "./htmlElementComponent";
import { AddHabitButton } from "./addHabitButton";
import { RefreshButton } from "./refreshButton";
import { SettingsButton } from "./settingsButton";
import { HabitCard } from "./habitCard";
import { HabitModal, HabitFormData } from "./habitModal";
import { HabitDataManager } from "../handlers/habitDataManager";
import { FrontmatterDataReader } from "../handlers/frontmatterDataReader";
import { HabitDataCache } from "../handlers/habitDataCache";
import { DateNavigator } from "./dateNavigator";
import { ViewModeSwitcher } from "./viewModeSwitcher";
import { Habit, ViewMode, TrackerSettings, ReportCalendar } from "../types/habitTypes";
import { HabitDetailsModal } from "./habitDetails/habitDetailsModal";
import { SettingsModal, SettingsFormData } from "./settingsModal";

/**
 * Main Dashboard component that displays the habit tracker interface
 */
export class Dashboard extends HTMLElementComponent {
	private app: App;
	private file: TFile;
	private dataManager: HabitDataManager;
	private frontmatterReader: FrontmatterDataReader | undefined;
	private dataCache: HabitDataCache | undefined;
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
		this.frontmatterReader = undefined; // Will be initialized after settings load
		this.dataCache = undefined; // Will be initialized after settings load
		this.currentDate = new Date(); // Default to today
		this.currentViewMode = ViewMode.GRID; // Default to grid view
	}

	render(): HTMLElement {
		const dashboard = createDiv({ cls: "habit-tracker-dashboard" });
		
		// Dashboard styling is handled by CSS

		// Controls row
		const controlsRow = createDiv({ cls: "dashboard-controls" });
		// Controls row styling is handled by CSS

		// Left side: Settings button, Add Habit button and Refresh button
		const leftControls = createDiv({ cls: "dashboard-left-controls" });
		
		const settingsButton = new SettingsButton(() => {
			this.showSettingsModal();
		});
		leftControls.appendChild(settingsButton.render());
		
		const addHabitButton = new AddHabitButton(() => {
			this.showAddHabitModal();
		});
		leftControls.appendChild(addHabitButton.render());

		const refreshButton = new RefreshButton(() => {
			void this.refresh().catch(error => {
				console.error("Error refreshing dashboard:", error);
			});
		});
		leftControls.appendChild(refreshButton.render());

		// Center: Date navigator
		const centerControls = createDiv({ cls: "dashboard-center-controls" });
		
		this.dateNavigator = new DateNavigator(
			this.app,
			this.currentDate,
			(date) => {
				void this.handleDateChange(date).catch(error => {
					console.error("Error handling date change:", error);
				});
			},
			this.currentSettings.reportCalendar || ReportCalendar.GREGORIAN
		);
		centerControls.appendChild(this.dateNavigator.render());

		// Right side: View mode switcher
		const rightControls = createDiv({ cls: "dashboard-right-controls" });
		// Right controls styling is handled by CSS
		
		this.viewModeSwitcher = new ViewModeSwitcher({
			currentMode: this.currentViewMode,
			onModeChange: (mode) => {
				void this.handleViewModeChange(mode).catch(error => {
					console.error("Error handling view mode change:", error);
				});
			}
		});
		rightControls.appendChild(this.viewModeSwitcher.render());

		controlsRow.appendChild(leftControls);
		controlsRow.appendChild(centerControls);
		controlsRow.appendChild(rightControls);

		dashboard.appendChild(controlsRow);

		// Mobile-specific styles are handled by CSS in styles.css

		// Habits container
		const habitsContainer = createDiv({ cls: "habits-container" });
		// Habits container styling is handled by CSS

		// Apply grid or list layout based on view mode
		this.updateContainerLayout(habitsContainer);

		// Store reference for updates
		this.container = habitsContainer;

		dashboard.appendChild(habitsContainer);

		return dashboard;
	}

	private isMobile(): boolean {
		return window.innerWidth <= 768;
	}

	private updateContainerLayout(container: HTMLElement): void {
		// Force List view on mobile regardless of saved settings
		const effectiveViewMode = this.isMobile() ? ViewMode.LIST : this.currentViewMode;

		if (effectiveViewMode === ViewMode.GRID) {
			container.className = "habits-container habits-container-grid";
		} else {
			container.className = "habits-container habits-container-list";
		}
	}

	async initialize(): Promise<void> {
		// Load settings from file first, before creating services
		await this.loadUserSettings();
		
		// Create services with loaded settings
		this.frontmatterReader = new FrontmatterDataReader(this.app, this.currentSettings);
		this.dataCache = new HabitDataCache(this.app, this.currentSettings);
		
		// Build the cache
		await this.dataCache.buildCache();
		
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
				dateFrontmatterProperty: formData.dateFrontmatterProperty,
				reportCalendar: formData.reportCalendar,
				minimumStreakLength: formData.minimumStreakLength
			};
			
			// Update frontmatter reader with new settings
			if (this.frontmatterReader) {
				this.frontmatterReader.updateSettings(this.currentSettings);
			}
			
			// Update date navigator calendar system
			if (this.dateNavigator) {
				this.dateNavigator.setCalendarSystem(this.currentSettings.reportCalendar || ReportCalendar.GREGORIAN);
			}
			
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
				// Use cache for faster lookups
				if (!this.dataCache) {
					continue;
				}
				const cachedValue = this.dataCache.getHabitValueForDate(
					habit,
					this.currentDate
				);
				if (cachedValue && cachedValue.value !== undefined) {
					this.habitValues.set(habit.id, cachedValue.value);
				}
			}
		} catch (error) {
			console.error("Error loading habit values:", error);
		}
	}

	private renderHabits(container: HTMLElement): void {
		container.empty();

		if (this.habits.length === 0) {
			const emptyState = createDiv({
				cls: "habit-dashboard-empty-state",
				text: "No habits yet. Click 'Add Habit' to create your first habit!"
			});
			container.appendChild(emptyState);
			return;
		}

		// Force List view on mobile regardless of saved settings
		const effectiveViewMode = this.isMobile() ? ViewMode.LIST : this.currentViewMode;

		this.habits.forEach(habit => {
			const habitCard = new HabitCard({
				habit: habit,
				currentValue: this.habitValues.get(habit.id),
				viewMode: effectiveViewMode,
				onEdit: (habitId) => this.handleEditHabit(habitId),
				onDuplicate: (habitId) => {
				void this.handleDuplicateHabit(habitId).catch(error => {
					console.error("Error duplicating habit:", error);
				});
			},
				onDelete: (habitId) => {
					void this.handleDeleteHabit(habitId).catch(error => {
						console.error("Error deleting habit:", error);
					});
				},
				onClick: (habitId) => this.handleHabitClick(habitId),
				onDragStart: (habitId, event) => this.handleDragStart(habitId, event),
				onDragOver: (event) => this.handleDragOver(event),
				onDrop: (habitId, event) => {
					void this.handleDrop(habitId, event).catch(error => {
						console.error("Error handling drop:", error);
					});
				},
				onDragEnd: () => this.handleDragEnd()
			});
			container.appendChild(habitCard.render());
		});
	}

	private showAddHabitModal(): void {
		const modal = new HabitModal(
			this.app,
			(formData: HabitFormData) => {
				void this.handleAddHabit(formData).catch(error => {
					console.error("Error adding habit:", error);
				});
			}
		);
		modal.open();
	}

	private showSettingsModal(): void {
		const modal = new SettingsModal(
			this.app,
			(formData: SettingsFormData) => {
				void this.handleSaveSettings(formData).catch(error => {
					console.error("Error saving settings:", error);
				});
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
				themeColor: formData.themeColor,
				graceDays: formData.graceDays,
				completionRule: formData.completionRule
			});

			this.habits.push(newHabit);
			
			// Rebuild cache to include the new habit
			if (this.dataCache) {
				await this.dataCache.buildCache();
			}
			
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
			(formData: HabitFormData) => {
				void this.handleUpdateHabit(habitId, formData).catch(error => {
					console.error("Error updating habit:", error);
				});
			},
			{
				name: habit.name,
				emoji: habit.emoji,
				type: habit.type,
				frontmatterField: habit.frontmatterField,
				unit: habit.unit,
				target: habit.target,
				visualization: habit.visualization,
				themeColor: habit.themeColor,
				graceDays: habit.graceDays,
				completionRule: habit.completionRule
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
				themeColor: formData.themeColor,
				graceDays: formData.graceDays,
				completionRule: formData.completionRule
			});

			await this.loadHabits();
			
			// Rebuild cache to reflect habit changes
			if (this.dataCache) {
				await this.dataCache.buildCache();
			}
			
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
				visualization: habit.visualization,
				completionRule: habit.completionRule
			});

			this.habits.push(newHabit);
			
			// Rebuild cache to include the duplicated habit
			if (this.dataCache) {
				await this.dataCache.buildCache();
			}
			
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
			
			// Rebuild cache to reflect habit deletion
			if (this.dataCache) {
				await this.dataCache.buildCache();
			}
			
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

		if (!this.dataCache) {
			console.error("Data cache not initialized");
			return;
		}

		const modal = new HabitDetailsModal(this.app, {
			habitId: habit.id,
			habitName: habit.name,
			habitEmoji: habit.emoji,
			habitType: habit.type,
			unit: habit.unit,
			target: habit.target,
			trackerSettings: this.currentSettings,
			trackerFilePath: this.file.path,
			onClose: () => {
				modal.close();
				// Reload habits to pick up any theme color changes
				void this.loadHabits().then(() => {
					if (this.container) {
						this.renderHabits(this.container);
					}
				}).catch(error => {
					console.error("Error reloading habits after modal close:", error);
				});
			}
		}, habit, this.dataCache);
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
		if (event.dataTransfer) {
			event.dataTransfer.setData("text/plain", habitId);
		}
	}

	private handleDragOver(event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}

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

		const indicator = createDiv({ cls: "drop-indicator" });

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
	 * Refreshes the dashboard by reloading habits and rebuilding cache
	 */
	async refresh(): Promise<void> {
		await this.loadHabits();
		await this.loadUserSettings();
		
		// Rebuild cache with updated settings
		if (this.dataCache) {
			this.dataCache.updateSettings(this.currentSettings);
			await this.dataCache.buildCache();
		}
		
		await this.loadHabitValues();
		if (this.container) {
			this.renderHabits(this.container);
		}
	}
}