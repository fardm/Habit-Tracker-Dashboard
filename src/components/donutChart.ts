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

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", this.size.toString());
		svg.setAttribute("height", this.size.toString());
		svg.setAttribute("viewBox", `0 0 ${this.size} ${this.size}`);
		svg.setAttribute("class", "habit-donut-svg");

		// Background circle
		const backgroundCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		backgroundCircle.setAttribute("cx", (this.size / 2).toString());
		backgroundCircle.setAttribute("cy", (this.size / 2).toString());
		backgroundCircle.setAttribute("r", ((this.size - this.strokeWidth) / 2).toString());
		backgroundCircle.setAttribute("fill", "none");
		backgroundCircle.setAttribute("stroke", "var(--background-modifier-border)");
		backgroundCircle.setAttribute("stroke-width", this.strokeWidth.toString());
		backgroundCircle.setAttribute("class", "habit-donut-background-circle");

		// Progress circle
		const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		progressCircle.setAttribute("cx", (this.size / 2).toString());
		progressCircle.setAttribute("cy", (this.size / 2).toString());
		progressCircle.setAttribute("r", ((this.size - this.strokeWidth) / 2).toString());
		progressCircle.setAttribute("fill", "none");
		progressCircle.setAttribute("stroke", color || (normalizedProgress >= 1 ? "var(--text-success)" : "#90EE90"));
		progressCircle.setAttribute("stroke-width", this.strokeWidth.toString());
		progressCircle.setAttribute("stroke-linecap", "round");
		progressCircle.setAttribute("stroke-dasharray", circumference.toString());
		progressCircle.setAttribute("stroke-dashoffset", strokeDashoffset.toString());
		progressCircle.setAttribute("class", isExceeded ? "habit-donut-progress-circle-exceeded" : "habit-donut-progress-circle");

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