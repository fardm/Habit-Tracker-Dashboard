/**
 * Component for rendering a compact progress bar
 */
export class ProgressBar {
	private container: HTMLElement;
	private width: number;
	private height: number;

	constructor(width: number = 80, height: number = 4) {
		this.width = width;
		this.height = height;
		this.container = document.createElement("div");
		this.container.style.cssText = `
			display: inline-block;
			width: ${width}px;
			height: ${height}px;
		`;
	}

	/**
	 * Renders the progress bar with the given progress (0-1)
	 */
	render(progress: number): HTMLElement {
		this.container.empty();

		const normalizedProgress = Math.min(Math.max(progress, 0), 1);
		const progressPercent = normalizedProgress * 100;

		const barContainer = document.createElement("div");
		barContainer.style.cssText = `
			width: 100%;
			height: 100%;
			background-color: var(--background-modifier-border);
			border-radius: ${this.height / 2}px;
			overflow: hidden;
		`;

		const barFill = document.createElement("div");
		barFill.style.cssText = `
			width: ${progressPercent}%;
			height: 100%;
			background-color: var(--interactive-accent);
			border-radius: ${this.height / 2}px;
			transition: width 0.3s ease;
		`;

		barContainer.appendChild(barFill);
		this.container.appendChild(barContainer);

		return this.container;
	}

	/**
	 * Gets the container element
	 */
	getElement(): HTMLElement {
		return this.container;
	}
}