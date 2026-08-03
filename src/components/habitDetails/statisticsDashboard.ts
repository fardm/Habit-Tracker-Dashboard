import { HTMLElementComponent } from "../htmlElementComponent";
import { StatisticsDashboardProps, HabitStatistics } from "../../types/habitDetailsTypes";

/**
 * StatisticsDashboard component for displaying habit statistics
 */
export class StatisticsDashboard extends HTMLElementComponent {
	private props: StatisticsDashboardProps;

	constructor(props: StatisticsDashboardProps) {
		super();
		this.props = props;
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	render(): HTMLElement {
		const container = createDiv({ cls: "statistics-dashboard" });
		// Container styling is handled by CSS

		const title = createEl("h3", {
			cls: "statistics-title",
			text: "Statistics"
		});
		container.appendChild(title);

		// Statistics grid
		const grid = createDiv({ cls: "statistics-grid" });

		// Stat items
		const stats = this.getStatItems();
		stats.forEach(stat => {
			const statItem = this.createStatItem(stat);
			grid.appendChild(statItem);
		});

		container.appendChild(grid);
		return container;
	}

	private getStatItems(): Array<{ label: string; value: string; icon: string }> {
		const unit = this.props.unit ? ` ${this.props.unit}` : "";
		const stats = this.props.statistics;
		
		if (this.props.habitType === "boolean") {
			return [
				{ label: "Completed", value: stats.total.toString(), icon: "✅" },
				{ label: "Missed", value: stats.highest.toString(), icon: "❌" },
				{ label: "Completion Rate", value: `${Math.round(stats.completionRate)}%`, icon: "📊" }
			];
		} else {
			return [
				{ label: "Total", value: `${Math.round(stats.total)}${unit}`, icon: "📊" },
				{ label: "Average", value: `${Math.round(stats.average)}${unit}`, icon: "📈" },
				{ label: "Highest", value: `${Math.round(stats.highest)}${unit}`, icon: "🔝" },
				{ label: "Lowest", value: `${Math.round(stats.lowest)}${unit}`, icon: "📉" }
			];
		}
	}

	private createStatItem(stat: { label: string; value: string; icon: string }): HTMLElement {
		const item = createDiv({ cls: "statistics-item" });

		const icon = createDiv({
			cls: "statistics-icon",
			text: stat.icon
		});
		item.appendChild(icon);

		const value = createDiv({
			cls: "statistics-value",
			text: stat.value
		});
		item.appendChild(value);

		const label = createDiv({
			cls: "statistics-label",
			text: stat.label
		});
		item.appendChild(label);

		return item;
	}
}
