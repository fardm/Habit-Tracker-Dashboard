/**
 * Singleton manager for handling active menu state
 */
export class MenuManager {
	private static instance: MenuManager;
	private activeMenu?: HTMLElement;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	// Empty constructor required for singleton pattern - initialization handled in getInstance()
	private constructor() {}

	static getInstance(): MenuManager {
		if (!MenuManager.instance) {
			MenuManager.instance = new MenuManager();
		}
		return MenuManager.instance;
	}

	/**
	 * Sets the active menu and closes any previously active menu
	 */
	setActiveMenu(menu: HTMLElement): void {
		if (this.activeMenu && this.activeMenu !== menu) {
			this.activeMenu.remove();
		}
		this.activeMenu = menu;
	}

	/**
	 * Clears the active menu
	 */
	clearActiveMenu(): void {
		this.activeMenu = undefined;
	}

	/**
	 * Gets the currently active menu
	 */
	getActiveMenu(): HTMLElement | undefined {
		return this.activeMenu;
	}
}