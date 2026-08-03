import { DateRangeFilter } from "../types/habitTypes";

/**
 * Gets the start and end dates for a given date range filter
 */
export function getDateRange(filter: DateRangeFilter, customStartDate?: Date, customEndDate?: Date): { start: Date; end: Date } {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	
	switch (filter) {
		case DateRangeFilter.YESTERDAY: {
			const yesterday = new Date(today);
			yesterday.setDate(today.getDate() - 1);
			return {
				start: yesterday,
				end: today
			};
		}
		
		case DateRangeFilter.TODAY:
			return {
				start: today,
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
			};
		
		case DateRangeFilter.THIS_WEEK: {
			const dayOfWeek = today.getDay();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - dayOfWeek);
			return {
				start: startOfWeek,
				end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
			};
		}
		
		case DateRangeFilter.THIS_MONTH: {
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			return {
				start: startOfMonth,
				end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000)
			};
		}
		
		case DateRangeFilter.LAST_30_DAYS: {
			const thirtyDaysAgo = new Date(today);
			thirtyDaysAgo.setDate(today.getDate() - 30);
			return {
				start: thirtyDaysAgo,
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
			};
		}
		
		case DateRangeFilter.LAST_90_DAYS: {
			const ninetyDaysAgo = new Date(today);
			ninetyDaysAgo.setDate(today.getDate() - 90);
			return {
				start: ninetyDaysAgo,
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
			};
		}
		
		case DateRangeFilter.THIS_YEAR: {
			const startOfYear = new Date(today.getFullYear(), 0, 1);
			const endOfYear = new Date(today.getFullYear() + 1, 0, 0);
			return {
				start: startOfYear,
				end: endOfYear
			};
		}
		
		case DateRangeFilter.CUSTOM:
			if (customStartDate && customEndDate) {
				return {
					start: customStartDate,
					end: customEndDate
				};
			}
			// Fallback to today if custom dates not provided
			return {
				start: today,
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
			};
		
		default:
			return {
				start: today,
				end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
			};
	}
}

/**
 * Formats a date range for display
 */
export function formatDateRange(filter: DateRangeFilter, customStartDate?: Date, customEndDate?: Date): string {
	switch (filter) {
		case DateRangeFilter.YESTERDAY:
			return "Yesterday";
		case DateRangeFilter.TODAY:
			return "Today";
		case DateRangeFilter.THIS_WEEK:
			return "This Week";
		case DateRangeFilter.THIS_MONTH:
			return "This Month";
		case DateRangeFilter.LAST_30_DAYS:
			return "Last 30 Days";
		case DateRangeFilter.LAST_90_DAYS:
			return "Last 90 Days";
		case DateRangeFilter.THIS_YEAR:
			return "This Year";
		case DateRangeFilter.CUSTOM:
			if (customStartDate && customEndDate) {
				return `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`;
			}
			return "Custom Range";
		default:
			return "Today";
	}
}