import { App, TFile } from "obsidian";
import { Habit, TrackerSettings, DataSourceType, HabitType } from "../types/habitTypes";
import { parseLocalISODate, toLocalISODate } from "../utils/calendarAdapter";

/**
 * Cached habit value for a specific date and habit
 */
export interface CachedHabitValue {
	date: string;
	value: boolean | number;
	filePath: string;
}

/**
 * Cache entry for a file
 */
export interface FileCacheEntry {
	filePath: string;
	date: Date;
	frontmatter: Record<string, any> | null;
}

/**
 * Service for caching habit data to avoid repeated file scanning
 * Indexes files once and provides fast lookups by date
 */
export class HabitDataCache {
	private app: App;
	private settings: TrackerSettings;
	private fileCache: Map<string, FileCacheEntry> = new Map();
	private habitValueCache: Map<string, Map<string, CachedHabitValue>> = new Map();
	private isBuilt: boolean = false;

	constructor(app: App, settings: TrackerSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Updates the settings and rebuilds the cache
	 */
	updateSettings(settings: TrackerSettings): void {
		this.settings = settings;
		this.clearCache();
	}

	/**
	 * Clears all cached data
	 */
	clearCache(): void {
		this.fileCache.clear();
		this.habitValueCache.clear();
		this.isBuilt = false;
	}

	/**
	 * Builds the cache by scanning all files in the configured data source
	 */
	async buildCache(): Promise<void> {
		this.clearCache();

		const files = await this.getFilesToScan();

		for (const file of files) {
			try {
				const date = this.extractDateFromFilename(file.name);
				
				if (date) {
					// Use Obsidian's metadataCache for reliable frontmatter parsing
					const fileCache = this.app.metadataCache.getFileCache(file);
					const frontmatter = fileCache?.frontmatter || null;
					
					if (frontmatter) {
						// File has frontmatter
					} else {
						// No frontmatter found
					}
					
					this.fileCache.set(file.path, {
						filePath: file.path,
						date: date,
						frontmatter: frontmatter
					});
				} else {
					// No date found in filename
				}
			} catch (error) {
				console.error(`[HabitDataCache] Error reading file ${file.path}:`, error);
			}
		}

		this.isBuilt = true;
	}

	/**
	 * Gets files to scan based on data source settings
	 */
	private async getFilesToScan(): Promise<TFile[]> {
		let files: TFile[];

		if (this.settings.dataSourceType === DataSourceType.FOLDER && this.settings.dataSourceValue) {
			const folderPath = this.settings.dataSourceValue;
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			
			if (!folder || !('children' in folder)) {
				return [];
			}

			files = this.app.vault.getMarkdownFiles().filter(file =>
				file.path.startsWith(folderPath + '/') || file.path === folderPath
			);
		} else {
			// Scan all markdown files if no folder specified
			files = this.app.vault.getMarkdownFiles();
		}

		return files;
	}

	/**
	 * Extracts date from filename using YYYY-MM-DD pattern (Gregorian ISO).
	 */
	private extractDateFromFilename(filename: string): Date | null {
		const datePattern = /(\d{4}-\d{2}-\d{2})/;
		const match = filename.match(datePattern);
		
		if (match) {
			const date = parseLocalISODate(match[1]);
			if (!isNaN(date.getTime())) {
				return date;
			}
		}
		
		return null;
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
		
		const lines = frontmatterText.split('\n');
		for (const line of lines) {
			const colonIndex = line.indexOf(':');
			if (colonIndex > 0) {
				const key = line.substring(0, colonIndex).trim();
				const value = line.substring(colonIndex + 1).trim();
				frontmatter[key] = value;
			}
		}
		
		return frontmatter;
	}

	/**
	 * Gets habit values for a specific habit within a date range
	 */
	getHabitValues(habit: Habit, startDate?: Date, endDate?: Date): CachedHabitValue[] {
		if (!this.isBuilt) {
			return [];
		}

		const values: CachedHabitValue[] = [];
		const habitId = habit.id;

		// Check if we have cached values for this habit
		if (this.habitValueCache.has(habitId)) {
			const cachedValues = this.habitValueCache.get(habitId)!;
			for (const [dateStr, value] of cachedValues) {
				const date = parseLocalISODate(dateStr.split("T")[0]);
				if ((!startDate || date >= startDate) && (!endDate || date <= endDate)) {
					values.push(value);
				}
			}
			return values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		}

		// Build cache for this habit
		const habitCache = new Map<string, CachedHabitValue>();
		let matchCount = 0;
		
		for (const [filePath, entry] of this.fileCache) {
			const frontmatter = entry.frontmatter;
			
			if (frontmatter && habit.frontmatterField in frontmatter) {
				const rawValue = frontmatter[habit.frontmatterField];
				const processedValue = this.processValue(rawValue, habit.type);
				
				if (processedValue !== null) {
					matchCount++;
					const dateStr = toLocalISODate(entry.date);
					const cachedValue: CachedHabitValue = {
						date: dateStr,
						value: processedValue,
						filePath: filePath
					};
					habitCache.set(dateStr, cachedValue);
					values.push(cachedValue);
				}
			}
		}

		// Cache the results for this habit
		this.habitValueCache.set(habitId, habitCache);
		
		// Filter by date range and sort
		const filtered = values.filter(v => {
			const date = parseLocalISODate(v.date.split("T")[0]);
			return (!startDate || date >= startDate) && (!endDate || date <= endDate);
		});
		
		return filtered.sort((a, b) => parseLocalISODate(b.date.split("T")[0]).getTime() - parseLocalISODate(a.date.split("T")[0]).getTime());
	}

	/**
	 * Gets the latest value for a habit within a date range
	 */
	getLatestHabitValue(habit: Habit, startDate?: Date, endDate?: Date): CachedHabitValue | null {
		const values = this.getHabitValues(habit, startDate, endDate);
		return values.length > 0 ? values[0] : null;
	}

	/**
	 * Gets habit value for a specific date
	 */
	getHabitValueForDate(habit: Habit, date: Date): CachedHabitValue | null {
		const dateStr = toLocalISODate(date);
		const startDate = new Date(date);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(date);
		endDate.setHours(23, 59, 59, 999);
		
		const values = this.getHabitValues(habit, startDate, endDate);
		return values.length > 0 ? values[0] : null;
	}

	/**
	 * Processes a raw value based on habit type
	 */
	private processValue(rawValue: any, habitType: HabitType): boolean | number | null {
		if (habitType === HabitType.BOOLEAN) {
			if (typeof rawValue === 'boolean') return rawValue;
			if (typeof rawValue === 'string') {
				const lower = rawValue.toLowerCase();
				if (lower === 'true' || lower === 'yes' || lower === '1') return true;
				if (lower === 'false' || lower === 'no' || lower === '0') return false;
			}
			return null;
		} else if (habitType === HabitType.NUMERIC) {
			const num = Number(rawValue);
			return isNaN(num) ? null : num;
		}
		return null;
	}

	/**
	 * Returns cache statistics
	 */
	getStats(): { files: number; habits: number; isBuilt: boolean } {
		return {
			files: this.fileCache.size,
			habits: this.habitValueCache.size,
			isBuilt: this.isBuilt
		};
	}
}
