import { HTMLElementComponent } from "./htmlElementComponent";
import { Habit, ViewMode, Visualization, CompletionOperator } from "../types/habitTypes";
import { HabitMenu } from "./habitMenu";
import { DonutChart } from "./donutChart";
import { ProgressBar } from "./progressBar";
import { createTranslucentColor } from "../utils/colorUtils";

export interface HabitCardProps {
	habit: Habit;
	currentValue: boolean | number | undefined;
	viewMode: ViewMode;
	onEdit: (habitId: string) => void;
	onDuplicate: (habitId: string) => void;
	onDelete: (habitId: string) => void;
	onClick?: (habitId: string) => void;
	onDragStart?: (habitId: string, event: DragEvent) => void;
	onDragOver?: (event: DragEvent) => void;
	onDrop?: (habitId: string, event: DragEvent) => void;
	onDragEnd?: () => void;
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
		const habitColor = this.props.habit.themeColor;
		const cardBackground = habitColor ? createTranslucentColor(habitColor, 0.05) : "var(--background-secondary)";

		if (this.props.viewMode === ViewMode.GRID) {
			card.style.cssText = `
				background-color: ${cardBackground};
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 16px 40px 16px 40px;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
				transition: border-color 0.2s, box-shadow 0.2s;
				min-height: 90px;
				position: relative;
				cursor: pointer;
			`;
		} else {
			card.style.cssText = `
				background-color: ${cardBackground};
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 16px 40px 16px 40px;
				margin-bottom: 12px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				transition: border-color 0.2s, box-shadow 0.2s;
				min-height: 90px;
				position: relative;
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

		// Menu button - positioned at top-right
		const menuButton = document.createElement("button");
		menuButton.className = "habit-menu-btn";
		menuButton.innerHTML = "⋮";
		menuButton.style.cssText = `
			position: absolute;
			top: 8px;
			right: 8px;
			background: none;
			box-shadow: none;
			border: none;
			color: var(--text-muted);
			font-size: 20px;
			cursor: pointer;
			padding: 4px;
			border-radius: 4px;
			transition: color 0.2s, background-color 0.2s;
			z-index: 10;
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

		card.appendChild(menuButton);

		// Drag handle - positioned absolutely on the left
		const dragHandle = document.createElement("div");
		dragHandle.className = "habit-drag-handle";
		dragHandle.innerHTML = "⋮⋮";
		dragHandle.style.cssText = `
			position: absolute;
			left: 8px;
			top: 50%;
			transform: translateY(-50%);
			cursor: grab;
			color: var(--text-muted);
			font-size: 16px;
			line-height: 1;
			letter-spacing: -2px;
			padding: 4px;
			user-select: none;
			transition: color 0.2s;
			z-index: 5;
		`;
		dragHandle.addEventListener("mouseenter", () => {
			dragHandle.style.color = "var(--text-normal)";
		});
		dragHandle.addEventListener("mouseleave", () => {
			dragHandle.style.color = "var(--text-muted)";
		});
		dragHandle.addEventListener("mousedown", () => {
			dragHandle.style.cursor = "grabbing";
		});
		dragHandle.addEventListener("mouseup", () => {
			dragHandle.style.cursor = "grab";
		});

		// Make card draggable
		card.setAttribute("draggable", "true");
		card.addEventListener("dragstart", (e) => {
			if (this.props.onDragStart) {
				this.props.onDragStart(this.props.habit.id, e);
			}
			e.dataTransfer!.effectAllowed = "move";
			card.style.opacity = "0.5";
		});
		card.addEventListener("dragend", () => {
			card.style.opacity = "1";
			if (this.props.onDragEnd) {
				this.props.onDragEnd();
			}
		});
		card.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (this.props.onDragOver) {
				this.props.onDragOver(e);
			}
		});
		card.addEventListener("drop", (e) => {
			e.preventDefault();
			if (this.props.onDrop) {
				this.props.onDrop(this.props.habit.id, e);
			}
		});

		// Card click handler (for opening details modal)
		card.addEventListener("click", (e) => {
			// Don't trigger if clicking on menu button or drag handle
			if ((e.target as HTMLElement).closest('.habit-menu-btn') || 
				(e.target as HTMLElement).closest('.habit-drag-handle')) {
				return;
			}
			if (this.props.onClick) {
				this.props.onClick(this.props.habit.id);
			}
		});

		card.appendChild(dragHandle);

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
		const bgColor = this.props.habit.themeColor || 'var(--interactive-accent)';
		const emojiBackground = createTranslucentColor(bgColor, 0.20);
		emoji.style.cssText = `
			font-size: 24px;
			border-radius: 6px;
			padding: 10px;
			background-color: ${emojiBackground};
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

		// Status display
		const statusDisplay = this.renderStatusDisplay();

		if (this.props.viewMode === ViewMode.GRID) {
			// Grid layout: horizontal arrangement like list view
			card.appendChild(leftSide);
			card.appendChild(statusDisplay);
		} else {
			// List layout: horizontal arrangement
			card.appendChild(leftSide);
			card.appendChild(statusDisplay);
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
			const checkIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-success);"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>`;
			const dashedIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"></circle></svg>`;
			
			// Create vertical layout for icon and text
			const booleanContainer = document.createElement("div");
			booleanContainer.style.cssText = `
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 4px;
			`;
			
			const iconContainer = document.createElement("div");
			iconContainer.innerHTML = completed ? checkIcon : dashedIcon;
			
			const statusText = document.createElement("div");
			statusText.textContent = completed ? "Done" : "Not done";
			statusText.style.cssText = `
				font-size: 11px;
				color: ${completed ? 'var(--text-success)' : 'var(--text-muted)'};
				font-weight: 500;
			`;
			
			booleanContainer.appendChild(iconContainer);
			booleanContainer.appendChild(statusText);
			statusContainer.appendChild(booleanContainer);
			
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
			const completionOperator = this.props.habit.completionRule?.operator || CompletionOperator.AT_LEAST;
			
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
			
			// Determine completion status based on operator
			let isCompleted = false;
			if (target !== undefined) {
				switch (completionOperator) {
					case CompletionOperator.AT_LEAST:
						isCompleted = value >= target;
						break;
					case CompletionOperator.AT_MOST:
						isCompleted = value <= target;
						break;
					case CompletionOperator.EXACTLY:
						isCompleted = value === target;
						break;
				}
			}
			
			if (target) {
				// Target is set
				let progress = 0;
				let extra = 0;
				let displayValue = value;
				let donutColor: string | undefined;
				
				switch (completionOperator) {
					case CompletionOperator.AT_LEAST:
						extra = value > target ? value - target : 0;
						displayValue = extra > 0 ? target : value;
						progress = Math.min(displayValue / target, 1);
						break;
					case CompletionOperator.AT_MOST:
						extra = value > target ? value - target : 0;
						displayValue = value;
						// Reverse progress: full donut = best (0 value), empty = at limit
						progress = 1 - Math.min(value / target, 1);
						// Color transitions based on usage
						if (value <= target * 0.5) {
							donutColor = "var(--text-success)"; // Green - best state
						} else if (value <= target * 0.8) {
							donutColor = "var(--text-accent)"; // Orange - warning
						} else if (value <= target) {
							donutColor = "var(--text-error)"; // Red - near limit
						}
						break;
					case CompletionOperator.EXACTLY:
						displayValue = value;
						progress = value === target ? 1 : Math.min(value / target, 1);
						break;
				}
				
				const isExceeded = extra > 0 && completionOperator === CompletionOperator.AT_LEAST;
				const isAtMostExceeded = extra > 0 && completionOperator === CompletionOperator.AT_MOST;
				
				// Add visualization based on setting
				if (visualization === Visualization.DONUT) {
					const donutChart = new DonutChart(32, 5);
					const chartElement = donutChart.render(progress, isExceeded, donutColor);
					visualizationContainer.appendChild(chartElement);
					
					// Add thin ring for exceeded targets (At least)
					if (isExceeded) {
						const thinRing = document.createElement("div");
						thinRing.style.cssText = `
							position: absolute;
							width: 40px;
							height: 40px;
							border: 2px solid var(--text-success);
							border-radius: 50%;
							opacity: 0.4;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(thinRing);
					}
					
					// Add overflow ring for At most when exceeded
					if (isAtMostExceeded) {
						const overflowRing = document.createElement("div");
						overflowRing.style.cssText = `
							position: absolute;
							width: 40px;
							height: 40px;
							border: 2px solid var(--text-error);
							border-radius: 50%;
							opacity: 0.4;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(overflowRing);
					}
					
					// Add checkmark icon for At least when completed
					if (completionOperator === CompletionOperator.AT_LEAST && isCompleted) {
						const checkIcon = document.createElement("div");
						checkIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-success);"><path d="M20 6L9 17l-5-5"></path></svg>`;
						checkIcon.style.cssText = `
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(checkIcon);
					}
					
					// Add warning icon for At most when exceeded
					if (isAtMostExceeded) {
						const warningIcon = document.createElement("div");
						warningIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-error);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
						warningIcon.style.cssText = `
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(warningIcon);
					}
				} else if (visualization === Visualization.PROGRESS_BAR) {
					const progressBar = new ProgressBar(80, 6);
					const barElement = progressBar.render(progress);
					visualizationContainer.appendChild(barElement);
					
					// Add thin ring for exceeded targets (around the bar)
					if (isExceeded) {
						const thinRing = document.createElement("div");
						thinRing.style.cssText = `
							position: absolute;
							width: 88px;
							height: 12px;
							border: 1px solid var(--text-success);
							border-radius: 8px;
							opacity: 0.4;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
						`;
						visualizationContainer.style.position = "relative";
						visualizationContainer.appendChild(thinRing);
					}
				} else if (visualization === Visualization.CIRCLE_CHECK) {
					// Circle check visualization for numeric habits
					const checkIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-success);"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>`;
					const dashedIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"></circle></svg>`;
					
					const iconContainer = document.createElement("div");
					iconContainer.innerHTML = isCompleted ? checkIcon : dashedIcon;
					visualizationContainer.appendChild(iconContainer);
				}
				
				// Display text based on operator
				if (completionOperator === CompletionOperator.AT_LEAST && extra > 0) {
					progressText.textContent = `${target}/${target} ${unit} (+${extra})`;
				} else if (completionOperator === CompletionOperator.AT_MOST && extra > 0) {
					progressText.textContent = `${target}/${target} ${unit} (+${extra})`;
				} else {
					progressText.textContent = `${value}/${target} ${unit}`;
				}
			} else {
				// No target - show just value and unit
				if (visualization === Visualization.DONUT) {
					const donutChart = new DonutChart(32, 5);
					const chartElement = donutChart.render(1); // Always 100% complete
					visualizationContainer.appendChild(chartElement);
				} else if (visualization === Visualization.PROGRESS_BAR) {
					const progressBar = new ProgressBar(80, 6);
					const barElement = progressBar.render(1); // Always 100% complete
					visualizationContainer.appendChild(barElement);
				} else if (visualization === Visualization.CIRCLE_CHECK) {
					// Circle check visualization for numeric habits without target
					const checkIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-success);"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>`;
					const dashedIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted);"><circle cx="12" cy="12" r="10" stroke-dasharray="4 2"></circle></svg>`;
					
					const iconContainer = document.createElement("div");
					iconContainer.innerHTML = value > 0 ? checkIcon : dashedIcon;
					visualizationContainer.appendChild(iconContainer);
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