/**
 * Base class for components that render HTML elements
 */
export abstract class HTMLElementComponent {
	/**
	 * Renders the component and returns the HTML element
	 */
	abstract render(): HTMLElement;

	/**
	 * Initializes the component asynchronously (optional override)
	 */
	async initialize(): Promise<void> {
		// Override in subclasses if async initialization is needed
	}

	/**
	 * Mounts the component to a parent element
	 */
	async mount(parent: HTMLElement): Promise<void> {
		const element = this.render();
		parent.appendChild(element);
		await this.initialize();
	}

	/**
	 * Destroys the component and cleans up resources
	 */
	destroy(): void {
		// Override in subclasses if needed
	}
}