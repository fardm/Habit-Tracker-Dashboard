import { TFile, Vault } from "obsidian";
import { Habit, TrackerData, HabitType } from "../types/habitTypes";

/**
 * Manages habit data for tracker files
 * Handles reading and writing habit configurations to .tracker files
 */
export class HabitDataManager {
	private vault: Vault;
	private file: TFile;

	constructor(vault: Vault, file: TFile) {
		this.vault = vault;
		this.file = file;
	}

	/**
	 * Reads and parses the tracker file data
	 */
	async readTrackerData(): Promise<TrackerData> {
		try {
			const content = await this.vault.read(this.file);
			
			if (!content || content.trim() === "") {
				// Return empty data structure for new files
				return { habits: [], settings: {} };
			}

			// Parse the file content
			// For now, we'll store data as JSON in the file
			// In the future, this could be frontmatter or other formats
			const data = JSON.parse(content) as TrackerData;
			
			// Ensure habits array exists
			if (!data.habits) {
				data.habits = [];
			}

			// Ensure settings object exists
			if (!data.settings) {
				data.settings = {};
			}

			return data;
		} catch (error) {
			console.error("Error reading tracker data:", error);
			return { habits: [], settings: {} };
		}
	}

	/**
	 * Writes tracker data to the file
	 */
	async writeTrackerData(data: TrackerData): Promise<void> {
		try {
			const content = JSON.stringify(data, null, 2);
			await this.vault.modify(this.file, content);
		} catch (error) {
			console.error("Error writing tracker data:", error);
			throw error;
		}
	}

	/**
	 * Adds a new habit to the tracker
	 */
	async addHabit(habit: Omit<Habit, "id" | "createdAt">): Promise<Habit> {
		const data = await this.readTrackerData();
		
		// Generate unique ID
		const id = this.generateId();
		
		const newHabit: Habit = {
			...habit,
			id,
			createdAt: new Date().toISOString()
		};

		data.habits.push(newHabit);
		await this.writeTrackerData(data);
		
		return newHabit;
	}

	/**
	 * Removes a habit from the tracker
	 */
	async removeHabit(habitId: string): Promise<void> {
		const data = await this.readTrackerData();
		data.habits = data.habits.filter(h => h.id !== habitId);
		await this.writeTrackerData(data);
	}

	/**
	 * Updates an existing habit
	 */
	async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
		const data = await this.readTrackerData();
		const index = data.habits.findIndex(h => h.id === habitId);
		
		if (index !== -1) {
			data.habits[index] = { ...data.habits[index], ...updates };
			await this.writeTrackerData(data);
		}
	}

	/**
	 * Gets all habits from the tracker
	 */
	async getHabits(): Promise<Habit[]> {
		const data = await this.readTrackerData();
		return data.habits;
	}

	/**
	 * Generates a unique ID for habits
	 */
	private generateId(): string {
		return `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Validates a habit object
	 */
	static validateHabit(habit: Partial<Habit>): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!habit.name || habit.name.trim() === "") {
			errors.push("Habit name is required");
		}

		if (!habit.emoji || habit.emoji.trim() === "") {
			errors.push("Emoji is required");
		}

		if (!habit.type) {
			errors.push("Habit type is required");
		} else if (habit.type && !Object.values(HabitType).includes(habit.type)) {
			errors.push("Invalid habit type");
		}

		if (!habit.frontmatterField || habit.frontmatterField.trim() === "") {
			errors.push("Frontmatter field is required");
		}

		// Validate numeric habit specific fields
		if (habit.type === HabitType.NUMERIC) {
			if (habit.target !== undefined && habit.target <= 0) {
				errors.push("Target must be greater than 0 for numeric habits");
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}
}