import { App, TFile } from "obsidian";
import { Habit, HabitType, TrackerSettings, DataSourceType, DateExtractionMethod } from "../types/habitTypes";

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
	private settings: TrackerSettings;

	constructor(app: App, settings: TrackerSettings = {}) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Updates the settings for data extraction
	 */
	updateSettings(settings: TrackerSettings): void {
		this.settings = settings;
	}

	/**
	 * Reads habit values from markdown files based on data source settings
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
		
		// Get files based on data source settings
		let markdownFiles: TFile[];
		
		if (this.settings.dataSourceType === DataSourceType.FOLDER && this.settings.dataSourceValue) {
			// Folder mode: search only in specified folder
			const folderPath = this.settings.dataSourceValue;
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			
			if (!folder || !(folder as any).children) {
				// Folder doesn't exist or is invalid, return empty results
				return [];
			}
			
			// Get all markdown files in the folder
			markdownFiles = this.app.vault.getMarkdownFiles().filter(file => 
				file.path.startsWith(folderPath + '/') || file.path === folderPath
			);
		} else if (this.settings.dataSourceType === DataSourceType.TAG && this.settings.dataSourceValue) {
			// Tag mode: search all files but filter by tag
			markdownFiles = this.app.vault.getMarkdownFiles();
		} else {
			// No valid settings configured, return empty results
			return [];
		}
		
		for (const file of markdownFiles) {
			try {
				// Tag filtering: skip files that don't have the required tag
				if (this.settings.dataSourceType === DataSourceType.TAG && this.settings.dataSourceValue) {
					const hasTag = this.fileHasTag(file, this.settings.dataSourceValue);
					if (!hasTag) continue;
				}
				
				// Read file content
				const content = await this.app.vault.read(file);
				
				const fileDate = this.extractDateFromPath(file.path, content);
				
				// Filter by date range if specified
				if (startDate && fileDate < startDate) continue;
				if (endDate && fileDate > endDate) continue;
				
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
	 * Checks if a file has a specific tag using Obsidian's metadata cache
	 * @param file - The file to check
	 * @param tag - The tag to search for (with or without #)
	 */
	private fileHasTag(file: TFile, tag: string): boolean {
		// Normalize tag (remove # if present and convert to lowercase for comparison)
		const normalizedTag = tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase();
		
		// Use Obsidian's metadata cache to get file tags
		const fileCache = this.app.metadataCache.getFileCache(file);
		if (!fileCache) return false;
		
		// Check tags from metadata cache (includes both frontmatter and inline tags)
		const tags = fileCache.tags;
		if (tags) {
			for (const tagObj of Object.keys(tags)) {
				// Tags in cache are stored with # prefix
				const cachedTag = tagObj.startsWith('#') ? tagObj.substring(1).toLowerCase() : tagObj.toLowerCase();
				if (cachedTag === normalizedTag) {
					return true;
				}
			}
		}
		
		return false;
	}

	/**
	 * Extracts date from file path or frontmatter based on settings
	 * @param filePath - The file path
	 * @param content - The file content (for frontmatter extraction)
	 */
	private extractDateFromPath(filePath: string, content?: string): Date {
		// If frontmatter date extraction is configured and content is provided
		if (this.settings.dateExtractionMethod === DateExtractionMethod.FRONTMATTER && 
			this.settings.dateFrontmatterProperty && 
			content) {
			
			const frontmatter = this.parseFrontmatter(content);
			if (frontmatter && frontmatter[this.settings.dateFrontmatterProperty]) {
				const dateStr = frontmatter[this.settings.dateFrontmatterProperty];
				const date = new Date(dateStr);
				if (!isNaN(date.getTime())) {
					return date;
				}
			}
		}
		
		// Default: extract date from filename
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