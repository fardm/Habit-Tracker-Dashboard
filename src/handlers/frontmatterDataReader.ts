import { App, TFile } from "obsidian";
import { Habit, HabitType } from "../types/habitTypes";

/**
 * Interface for habit value data
 */
export interface HabitValue {
	date: string;
	value: boolean | number;
	filePath: string;
}

/**
 * Handles reading habit data from frontmatter in vault files
 */
export class FrontmatterDataReader {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Reads habit values from all markdown files in the vault
	 * @param habit - The habit to search for
	 * @param startDate - Optional start date for filtering
	 * @param endDate - Optional end date for filtering
	 */
	async getHabitValues(
		habit: Habit,
		startDate?: Date,
		endDate?: Date
	): Promise<HabitValue[]> {
		const values: HabitValue[] = [];
		
		// Get all markdown files
		const markdownFiles = this.app.vault.getMarkdownFiles();
		
		for (const file of markdownFiles) {
			try {
				const fileDate = this.extractDateFromPath(file.path);
				
				// Filter by date range if specified
				if (startDate && fileDate < startDate) continue;
				if (endDate && fileDate > endDate) continue;
				
				// Read file content
				const content = await this.app.vault.read(file);
				
				// Parse frontmatter
				const frontmatter = this.parseFrontmatter(content);
				
				// Check if the habit field exists in frontmatter
				if (frontmatter && habit.frontmatterField in frontmatter) {
					const rawValue = frontmatter[habit.frontmatterField];
					const processedValue = this.processValue(rawValue, habit.type);
					
					if (processedValue !== null) {
						values.push({
							date: fileDate.toISOString(),
							value: processedValue,
							filePath: file.path
						});
					}
				}
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}
		
		// Sort by date (newest first)
		return values.sort((a, b) => 
			new Date(b.date).getTime() - new Date(a.date).getTime()
		);
	}

	/**
	 * Gets the latest value for a habit
	 */
	async getLatestHabitValue(habit: Habit, startDate?: Date, endDate?: Date): Promise<HabitValue | null> {
		const values = await this.getHabitValues(habit, startDate, endDate);
		return values.length > 0 ? values[0] : null;
	}

	/**
	 * Extracts date from file path (assumes daily note format)
	 * @param filePath - The file path
	 */
	private extractDateFromPath(filePath: string): Date {
		// Try to extract date from filename
		// Common patterns: YYYY-MM-DD.md, YYYYMMDD.md, etc.
		const filename = filePath.split('/').pop() || '';
		const datePatterns = [
			/(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
			/(\d{8})/,             // YYYYMMDD
			/(\d{4}\d{2}\d{2})/    // YYYYMMDD
		];
		
		for (const pattern of datePatterns) {
			const match = filename.match(pattern);
			if (match) {
				const dateStr = match[1];
				// Try to parse the date
				const date = new Date(dateStr);
				if (!isNaN(date.getTime())) {
					return date;
				}
			}
		}
		
		// If no date found in filename, use file modification time
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			return new Date(file.stat.mtime);
		}
		
		// Fallback to current date
		return new Date();
	}

	/**
	 * Parses frontmatter from markdown content
	 */
	private parseFrontmatter(content: string): Record<string, any> | null {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
		const match = content.match(frontmatterRegex);
		
		if (!match) return null;
		
		const frontmatterText = match[1];
		const frontmatter: Record<string, any> = {};
		
		// Simple YAML-like parsing
		const lines = frontmatterText.split('\n');
		for (const line of lines) {
			const colonIndex = line.indexOf(':');
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim();
				const value = line.substring(colonIndex + 1).trim();
				
				// Try to parse as boolean or number
				if (value === 'true') {
					frontmatter[key] = true;
				} else if (value === 'false') {
					frontmatter[key] = false;
				} else if (!isNaN(Number(value))) {
					frontmatter[key] = Number(value);
				} else {
					// Remove quotes if present
					frontmatter[key] = value.replace(/^["']|["']$/g, '');
				}
			}
		}
		
		return frontmatter;
	}

	/**
	 * Processes a raw value based on habit type
	 */
	private processValue(rawValue: any, habitType: HabitType): boolean | number | null {
		if (rawValue === undefined || rawValue === null) return null;
		
		if (habitType === HabitType.BOOLEAN) {
			return Boolean(rawValue);
		} else if (habitType === HabitType.NUMERIC) {
			const num = Number(rawValue);
			return isNaN(num) ? null : num;
		}
		
		return null;
	}
}