/**
 * Component for rendering a donut progress chart
 */
export class DonutChart {
	private container: HTMLElement;
	private size: number;
	private strokeWidth: number;

	constructor(size = 32, strokeWidth = 3) {
		this.size = size;
		this.strokeWidth = strokeWidth;
		this.container = createDiv({ cls: "habit-donut-chart" });
		this.container.style.width = `${size}px`;
		this.container.style.height = `${size}px`;
	}

	/**
	 * Renders the donut chart with the given progress (0-1)
	 */
	render(progress: number, isExceeded = false, color?: string): HTMLElement {
		this.container.empty();

		const normalizedProgress = Math.min(Math.max(progress, 0), 1);
		const circumference = 2 * Math.PI * ((this.size - this.strokeWidth) / 2);
		const strokeDashoffset = circumference * (1 - normalizedProgress);

		const svg = createSvg("svg", {
			attr: {
				width: this.size.toString(),
				height: this.size.toString(),
				viewBox: `0 0 ${this.size} ${this.size}`
			},
			cls: "habit-donut-svg"
		});

		// Background circle
		const backgroundCircle = createSvg("circle", {
			attr: {
				cx: (this.size / 2).toString(),
				cy: (this.size / 2).toString(),
				r: ((this.size - this.strokeWidth) / 2).toString(),
				fill: "none",
				stroke: "var(--background-modifier-border)",
				"stroke-width": this.strokeWidth.toString()
			},
			cls: "habit-donut-background-circle"
		});

		// Progress circle
		const progressCircle = createSvg("circle", {
			attr: {
				cx: (this.size / 2).toString(),
				cy: (this.size / 2).toString(),
				r: ((this.size - this.strokeWidth) / 2).toString(),
				fill: "none",
				stroke: color || (normalizedProgress >= 1 ? "var(--text-success)" : "#90EE90"),
				"stroke-width": this.strokeWidth.toString(),
				"stroke-linecap": "round",
				"stroke-dasharray": circumference.toString(),
				"stroke-dashoffset": strokeDashoffset.toString()
			},
			cls: isExceeded ? "habit-donut-progress-circle-exceeded" : "habit-donut-progress-circle"
		});

		svg.appendChild(backgroundCircle);
		svg.appendChild(progressCircle);
		this.container.appendChild(svg);

		return this.container;
	}

	/**
	 * Gets the container element
	 */
	getElement(): HTMLElement {
		return this.container;
	}
}
