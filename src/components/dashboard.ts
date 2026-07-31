import { App, TFile } from "obsidian";
import { HTMLElementComponent } from "./htmlElementComponent";
import { AddHabitButton } from "./addHabitButton";
import { HabitCard } from "./habitCard";
import { HabitModal, HabitFormData } from "./habitModal";
import { HabitDataManager } from "../handlers/habitDataManager";
import { Habit, HabitType } from "../types/habitTypes";

/**
 * Main Dashboard component that displays the habit tracker interface
 */
export class Dashboard extends HTMLElementComponent {
	private app: App;
	private file: TFile;
	private dataManager: HabitDataManager;
	private habits: Habit[] = [];
	private container?: HTMLElement;

	constructor(app: App, file: TFile) {
		super();
		this.app = app;
		this.file = file;
		this.dataManager = new HabitDataManager(app.vault, file);
	}

	render(): HTMLElement {
		const dashboard = document.createElement("div");
		dashboard.className = "habit-tracker-dashboard";
		
		// Dashboard styling
		dashboard.style.cssText = `
			padding: 20px;
			max-width: 800px;
			margin: 0 auto;
		`;

		// Header
		const header = document.createElement("div");
		header.className = "dashboard-header";
		header.style.cssText = `
			margin-bottom: 24px;
		`;

		const title = document.createElement("h2");
		title.textContent = "Habit Dashboard";
		title.style.cssText = `
			margin: 0;
			font-size: 24px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		header.appendChild(title);
		dashboard.appendChild(header);

		// Add Habit button
		const addHabitButton = new AddHabitButton(() => {
			this.showAddHabitModal();
		});
		dashboard.appendChild(addHabitButton.render());

		// Habits container
		const habitsContainer = document.createElement("div");
		habitsContainer.className = "habits-container";
		habitsContainer.style.cssText = `
			margin-top: 16px;
		`;

		// Store reference for updates
		this.container = habitsContainer;

		dashboard.appendChild(habitsContainer);

		return dashboard;
	}

	async initialize(): Promise<void> {
		await this.loadHabits();
		if (this.container) {
			this.renderHabits(this.container);
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
			const habitCard = new HabitCard(habit, (habitId) => {
				this.handleDeleteHabit(habitId);
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
				frontmatterField: formData.frontmatterField
			});

			this.habits.push(newHabit);
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error adding habit:", error);
		}
	}

	private async handleDeleteHabit(habitId: string): Promise<void> {
		try {
			await this.dataManager.removeHabit(habitId);
			this.habits = this.habits.filter(h => h.id !== habitId);
			
			if (this.container) {
				this.renderHabits(this.container);
			}
		} catch (error) {
			console.error("Error deleting habit:", error);
		}
	}

	/**
	 * Refreshes the dashboard by reloading habits from the file
	 */
	async refresh(): Promise<void> {
		await this.loadHabits();
		if (this.container) {
			this.renderHabits(this.container);
		}
	}
}