import { HTMLElementComponent } from "./htmlElementComponent";
import { Habit, ViewMode, Visualization } from "../types/habitTypes";
import { HabitMenu } from "./habitMenu";
import { DonutChart } from "./donutChart";
import { ProgressBar } from "./progressBar";

export interface HabitCardProps {
	habit: Habit;
	currentValue: boolean | number | undefined;
	viewMode: ViewMode;
	onEdit: (habitId: string) => void;
	onDuplicate: (habitId: string) => void;
	onDelete: (habitId: string) => void;
}

/**
 * Component for displaying a single habit as a card
 */
export class HabitCard extends HTMLElementComponent {
	private props: HabitCardProps;
	private menu?: HabitMenu;

	constructor(props: HabitCardProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const card = document.createElement("div");
		card.className = "habit-card";
		card.setAttribute("data-habit-id", this.props.habit.id);
		card.style.position = "relative";

		// Apply grid or list styling based on view mode
		if (this.props.viewMode === ViewMode.GRID) {
			card.style.cssText = `
				background-color: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 16px;
				display: flex;
				flex-direction: column;
				gap: 12px;
				transition: border-color 0.2s, box-shadow 0.2s;
				min-height: 120px;
			`;
		} else {
			card.style.cssText = `
				background-color: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 16px;
				margin-bottom: 12px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				transition: border-color 0.2s, box-shadow 0.2s;
			`;
		}

		card.addEventListener("mouseenter", () => {
			card.style.borderColor = "var(--interactive-accent)";
			card.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
		});

		card.addEventListener("mouseleave", () => {
			card.style.borderColor = "var(--background-modifier-border)";
			card.style.boxShadow = "none";
		});

		// Left side: Emoji and name
		const leftSide = document.createElement("div");
		leftSide.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		const emoji = document.createElement("span");
		emoji.className = "habit-emoji";
		emoji.textContent = this.props.habit.emoji;
		emoji.style.cssText = `
			font-size: 24px;
		`;

		const habitInfo = document.createElement("div");
		habitInfo.style.cssText = `
			display: flex;
			flex-direction: column;
		`;

		const habitName = document.createElement("div");
		habitName.className = "habit-name";
		habitName.textContent = this.props.habit.name;
		habitName.style.cssText = `
			font-weight: 500;
			font-size: 14px;
			color: var(--text-normal);
		`;

		habitInfo.appendChild(habitName);
		leftSide.appendChild(emoji);
		leftSide.appendChild(habitInfo);

		// Right side: Status display
		const rightSide = document.createElement("div");
		rightSide.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
		`;

		// Status display with real data
		const statusDisplay = this.renderStatusDisplay();
		rightSide.appendChild(statusDisplay);

		// Menu button
		const menuButton = document.createElement("button");
		menuButton.className = "habit-menu-btn";
		menuButton.innerHTML = "⋮";
		menuButton.style.cssText = `
			background: none;
			border: none;
			color: var(--text-muted);
			font-size: 20px;
			cursor: pointer;
			padding: 4px 8px;
			border-radius: 4px;
			transition: color 0.2s, background-color 0.2s;
		`;

		menuButton.addEventListener("mouseenter", () => {
			menuButton.style.color = "var(--text-normal)";
			menuButton.style.backgroundColor = "var(--background-modifier-hover)";
		});

		menuButton.addEventListener("mouseleave", () => {
			menuButton.style.color = "var(--text-muted)";
			menuButton.style.backgroundColor = "transparent";
		});

		menuButton.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			this.showMenu(e, card);
		});

		rightSide.appendChild(menuButton);

		if (this.props.viewMode === ViewMode.GRID) {
			// Grid layout: stack elements vertically
			const contentContainer = document.createElement("div");
			contentContainer.style.cssText = `
				display: flex;
				flex-direction: column;
				gap: 12px;
				flex: 1;
			`;
			
			contentContainer.appendChild(leftSide);
			contentContainer.appendChild(rightSide);
			card.appendChild(contentContainer);
		} else {
			// List layout: horizontal arrangement
			card.appendChild(leftSide);
			card.appendChild(rightSide);
		}

		return card;
	}

	private renderStatusDisplay(): HTMLElement {
		const statusContainer = document.createElement("div");
		statusContainer.className = "habit-status";

		if (this.props.currentValue === undefined || this.props.currentValue === null) {
			statusContainer.textContent = "No data";
			statusContainer.style.cssText = `
				font-size: 12px;
				color: var(--text-muted);
				font-style: italic;
			`;
		} else if (this.props.habit.type === "boolean") {
			const completed = this.props.currentValue as boolean;
			// Use SVG icons for better appearance
			const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-success);"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>`;
			const dashedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"></circle></svg>`;
			
			statusContainer.innerHTML = completed ? checkIcon : dashedIcon;
			statusContainer.style.cssText = `
				font-size: 12px;
				color: var(--text-normal);
				font-weight: 500;
				display: flex;
				align-items: center;
			`;
		} else {
			const value = this.props.currentValue as number;
			const target = this.props.habit.target;
			const unit = this.props.habit.unit || "";
			const visualization = this.props.habit.visualization || Visualization.DONUT;
			
			// Create vertical layout container
			const verticalContainer = document.createElement("div");
			verticalContainer.style.cssText = `
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 8px;
			`;
			
			// Visualization container
			const visualizationContainer = document.createElement("div");
			visualizationContainer.style.cssText = `
				display: flex;
				justify-content: center;
				align-items: center;
			`;
			
			// Progress text
			const progressText = document.createElement("div");
			progressText.style.cssText = `
				font-size: 12px;
				color: var(--text-normal);
				font-weight: 500;
				text-align: center;
			`;
			
			if (target) {
				// Target is set
				const extra = value > target ? value - target : 0;
				const displayValue = extra > 0 ? target : value;
				const progress = Math.min(displayValue / target, 1);
				const isExceeded = extra > 0;
				
				// Add visualization based on setting
				if (visualization === Visualization.DONUT) {
					const donutChart = new DonutChart(32, 3);
					const chartElement = donutChart.render(progress);
					visualizationContainer.appendChild(chartElement);
					
					// Add thin ring for exceeded targets
					if (isExceeded) {
						const thinRing = document.createElement("div");
						thinRing.style.cssText = `
							position: absolute;
							width: 36px;
							height: 36px;
							border: 1px solid var(--interactive-accent);
							border-radius: 50%;
							opacity: 0.3;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(thinRing);
					}
				} else if (visualization === Visualization.PROGRESS_BAR) {
					const progressBar = new ProgressBar(80, 4);
					const barElement = progressBar.render(progress);
					visualizationContainer.appendChild(barElement);
					
					// Add thin ring for exceeded targets (around the bar)
					if (isExceeded) {
						const thinRing = document.createElement("div");
						thinRing.style.cssText = `
							position: absolute;
							width: 84px;
							height: 8px;
							border: 1px solid var(--interactive-accent);
							border-radius: 4px;
							opacity: 0.3;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(thinRing);
					}
				}
				
				// Display text with extra amount if exceeded
				if (extra > 0) {
					progressText.textContent = `${target}/${target} ${unit} (+${extra})`;
				} else {
					progressText.textContent = `${value}/${target} ${unit}`;
				}
			} else {
				// No target - show just value and unit
				if (visualization === Visualization.DONUT) {
					const donutChart = new DonutChart(32, 3);
					const chartElement = donutChart.render(1); // Always 100% complete
					visualizationContainer.appendChild(chartElement);
				} else if (visualization === Visualization.PROGRESS_BAR) {
					const progressBar = new ProgressBar(80, 4);
					const barElement = progressBar.render(1); // Always 100% complete
					visualizationContainer.appendChild(barElement);
				}
				
				progressText.textContent = `${value} ${unit}`;
			}
			
			verticalContainer.appendChild(visualizationContainer);
			verticalContainer.appendChild(progressText);
			statusContainer.appendChild(verticalContainer);
		}

		return statusContainer;
	}

	private showMenu(event: MouseEvent, card: HTMLElement): void {
		if (this.menu) return;

		const rect = (event.target as HTMLElement).getBoundingClientRect();
		const menu = new HabitMenu({
			onEdit: () => this.props.onEdit(this.props.habit.id),
			onDuplicate: () => this.props.onDuplicate(this.props.habit.id),
			onDelete: () => this.props.onDelete(this.props.habit.id),
			onClose: () => {
				this.menu = undefined;
			}
		});

		this.menu = menu;
		menu.show(rect, card);
	}
}