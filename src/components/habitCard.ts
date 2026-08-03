import { HTMLElementComponent } from "./htmlElementComponent";
import { Habit, ViewMode, Visualization, CompletionOperator } from "../types/habitTypes";
import { HabitMenu } from "./habitMenu";
import { DonutChart } from "./donutChart";
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
		const card = createDiv({
			cls: this.props.viewMode === ViewMode.LIST ? "habit-card habit-card-list" : "habit-card",
			attr: { "data-habit-id": this.props.habit.id }
		});

		// Apply grid or list styling based on view mode
		const habitColor = this.props.habit.themeColor;
		const cardBackground = habitColor ? createTranslucentColor(habitColor, 0.05) : "var(--background-secondary)";
		card.style.setProperty("--habit-card-bg", cardBackground);

		// Hover states are handled by CSS

		// Menu button - positioned at top-right
		const menuButton = createEl("button", {
			cls: "habit-menu-btn clickable-icon"
		});
		
		const menuSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		menuSvg.setAttribute("width", "16");
		menuSvg.setAttribute("height", "16");
		menuSvg.setAttribute("viewBox", "0 0 24 24");
		menuSvg.setAttribute("fill", "none");
		menuSvg.setAttribute("stroke", "currentColor");
		menuSvg.setAttribute("stroke-width", "2");
		menuSvg.setAttribute("stroke-linecap", "round");
		menuSvg.setAttribute("stroke-linejoin", "round");
		
		const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle1.setAttribute("cx", "12");
		circle1.setAttribute("cy", "12");
		circle1.setAttribute("r", "1");
		
		const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle2.setAttribute("cx", "12");
		circle2.setAttribute("cy", "5");
		circle2.setAttribute("r", "1");
		
		const circle3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle3.setAttribute("cx", "12");
		circle3.setAttribute("cy", "19");
		circle3.setAttribute("r", "1");
		
		menuSvg.appendChild(circle1);
		menuSvg.appendChild(circle2);
		menuSvg.appendChild(circle3);
		menuButton.appendChild(menuSvg);
		// Hover states are handled by CSS

		menuButton.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			this.showMenu(e, card);
		});

		card.appendChild(menuButton);

		// Drag handle - positioned absolutely on the left
		const dragHandle = createDiv({ cls: "habit-drag-handle" });
		
		const dragSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		dragSvg.setAttribute("width", "16");
		dragSvg.setAttribute("height", "16");
		dragSvg.setAttribute("viewBox", "0 0 24 24");
		dragSvg.setAttribute("fill", "none");
		dragSvg.setAttribute("stroke", "currentColor");
		dragSvg.setAttribute("stroke-width", "2");
		dragSvg.setAttribute("stroke-linecap", "round");
		dragSvg.setAttribute("stroke-linejoin", "round");
		
		const dragCircles = [
			{cx: 9, cy: 12}, {cx: 9, cy: 5}, {cx: 9, cy: 19},
			{cx: 15, cy: 12}, {cx: 15, cy: 5}, {cx: 15, cy: 19}
		];
		
		dragCircles.forEach(pos => {
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", pos.cx.toString());
			circle.setAttribute("cy", pos.cy.toString());
			circle.setAttribute("r", "1");
			dragSvg.appendChild(circle);
		});
		
		dragHandle.appendChild(dragSvg);
		// Hover and active states are handled by CSS

		// Make card draggable
		card.setAttribute("draggable", "true");
		card.addEventListener("dragstart", (e) => {
			if (this.props.onDragStart) {
				this.props.onDragStart(this.props.habit.id, e);
			}
			e.dataTransfer!.effectAllowed = "move";
			card.classList.add("habit-card-dragging");
		});
		card.addEventListener("dragend", () => {
			card.classList.remove("habit-card-dragging");
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
		const leftSide = createDiv({ cls: "habit-card-left-side" });

		const emoji = createSpan({
			cls: "habit-emoji",
			text: this.props.habit.emoji
		});
		const bgColor = this.props.habit.themeColor || 'var(--interactive-accent)';
		const emojiBackground = createTranslucentColor(bgColor, 0.20);
		emoji.style.setProperty("--habit-emoji-bg", emojiBackground);

		const habitInfo = createDiv({ cls: "habit-info" });

		const habitName = createDiv({
			cls: "habit-name",
			text: this.props.habit.name
		});

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
		const statusContainer = createDiv({ cls: "habit-status" });

		if (this.props.currentValue === undefined || this.props.currentValue === null) {
			statusContainer.textContent = "No data";
			statusContainer.className = "habit-status-no-data";
		} else if (this.props.habit.type === "boolean") {
			const completed = this.props.currentValue as boolean;
			
			// Create vertical layout for icon and text
			const booleanContainer = createDiv({ cls: "habit-boolean-container" });
			
			const iconContainer = createDiv({ cls: "habit-boolean-status-icon" });
			iconContainer.appendChild(this.createBooleanStatusIcon(completed));
			
			const statusText = createDiv({
				cls: completed ? "habit-boolean-status-text habit-boolean-status-text-done" : "habit-boolean-status-text habit-boolean-status-text-not-done",
				text: completed ? "Done" : "Not done"
			});
			
			booleanContainer.appendChild(iconContainer);
			booleanContainer.appendChild(statusText);
			statusContainer.appendChild(booleanContainer);
			
			statusContainer.className = "habit-status";
		} else {
			const value = this.props.currentValue as number;
			const target = this.props.habit.target;
			const unit = this.props.habit.unit || "";
			const visualization = this.props.habit.visualization || Visualization.DONUT;
			const completionOperator = this.props.habit.completionRule?.operator || CompletionOperator.AT_LEAST;
			
			// Create vertical layout container
			const verticalContainer = createDiv({ cls: "habit-vertical-container" });
			
			// Visualization container
			const visualizationContainer = createDiv({ cls: "habit-visualization-container" });
			
			// Progress text
			const progressText = createDiv({ cls: "habit-progress-text" });
			
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
					const chartElement = donutChart.render(progress, false, donutColor);
					visualizationContainer.appendChild(chartElement);
					
					// Add thin ring for exceeded targets (At least)
					if (isExceeded) {
						const thinRing = createDiv({ cls: "habit-thin-ring" });
						visualizationContainer.appendChild(thinRing);
					}
					
					// Add overflow ring for At most when exceeded
					if (isAtMostExceeded) {
						const overflowRing = createDiv({ cls: "habit-overflow-ring" });
						visualizationContainer.appendChild(overflowRing);
					}
					
					// Add checkmark icon for At least when completed
					if (completionOperator === CompletionOperator.AT_LEAST && isCompleted) {
						const checkIcon = createDiv({ cls: "habit-check-icon" });
						checkIcon.appendChild(this.createCheckIcon());
						visualizationContainer.appendChild(checkIcon);
					}
					
					// Add warning icon for At most when exceeded
					if (isAtMostExceeded) {
						const warningIcon = createDiv({ cls: "habit-warning-icon" });
						warningIcon.appendChild(this.createWarningIcon());
						visualizationContainer.appendChild(warningIcon);
					}
				} else if (visualization === Visualization.CIRCLE_CHECK) {
					// Circle check visualization for numeric habits
					const iconContainer = createDiv({ cls: "habit-circle-check-icon" });
					iconContainer.appendChild(this.createCircleCheckIcon(isCompleted));
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
				} else if (visualization === Visualization.CIRCLE_CHECK) {
					// Circle check visualization for numeric habits without target
					const iconContainer = createDiv({ cls: "habit-circle-check-icon" });
					iconContainer.appendChild(this.createCircleCheckIcon(value > 0));
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

	private createBooleanStatusIcon(completed: boolean): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "24");
		svg.setAttribute("height", "24");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.style.setProperty("--icon-color", completed ? "var(--text-success)" : "var(--text-muted)");

		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", "12");
		circle.setAttribute("cy", "12");
		circle.setAttribute("r", "10");
		if (!completed) {
			circle.setAttribute("stroke-dasharray", "4 2");
		}
		svg.appendChild(circle);

		if (completed) {
			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttribute("d", "M9 12l2 2 4-4");
			svg.appendChild(path);
		}

		return svg;
	}

	private createCheckIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "12");
		svg.setAttribute("height", "12");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "3");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", "M20 6L9 17l-5-5");
		svg.appendChild(path);

		return svg;
	}

	private createWarningIcon(): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "12");
		svg.setAttribute("height", "12");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "3");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z");
		svg.appendChild(path);

		const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line1.setAttribute("x1", "12");
		line1.setAttribute("y1", "9");
		line1.setAttribute("x2", "12");
		line1.setAttribute("y2", "13");
		svg.appendChild(line1);

		const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line2.setAttribute("x1", "12");
		line2.setAttribute("y1", "17");
		line2.setAttribute("x2", "12.01");
		line2.setAttribute("y2", "17");
		svg.appendChild(line2);

		return svg;
	}

	private createCircleCheckIcon(completed: boolean): SVGElement {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "24");
		svg.setAttribute("height", "24");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.style.setProperty("--icon-color", completed ? "var(--text-success)" : "var(--text-muted)");

		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", "12");
		circle.setAttribute("cy", "12");
		circle.setAttribute("r", "10");
		if (!completed) {
			circle.setAttribute("stroke-dasharray", "4 2");
		}
		svg.appendChild(circle);

		if (completed) {
			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttribute("d", "M9 12l2 2 4-4");
			svg.appendChild(path);
		}

		return svg;
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