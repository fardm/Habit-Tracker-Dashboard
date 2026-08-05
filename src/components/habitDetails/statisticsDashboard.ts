import { HTMLElementComponent } from "../htmlElementComponent";
import { StatisticsDashboardProps } from "../../types/habitDetailsTypes";
import { setIcon } from "obsidian";

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
				{ label: "Completed", value: stats.total.toString(), icon: "circle-check-big" },
				{ label: "Missed", value: stats.highest.toString(), icon: "circle-x" },
				{ label: "Completion Rate", value: `${Math.round(stats.completionRate)}%`, icon: "circle-percent" }
			];
		} else {
			return [
				{ label: "Total", value: `${Math.round(stats.total)}${unit}`, icon: "sigma" },
				{ label: "Average", value: `${Math.round(stats.average)}${unit}`, icon: "chart-line" },
				{ label: "Highest", value: `${Math.round(stats.highest)}${unit}`, icon: "trending-up" },
				{ label: "Lowest", value: `${Math.round(stats.lowest)}${unit}`, icon: "trending-down" }
			];
		}
	}

	private createStatItem(stat: { label: string; value: string; icon: string }): HTMLElement {
		const item = createDiv({ cls: "statistics-item" });

		const icon = createDiv({
			cls: "statistics-icon"
		});
		setIcon(icon, stat.icon);
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
