import { HTMLElementComponent } from "./htmlElementComponent";
import { MenuManager } from "./menuManager";

export interface HabitMenuProps {
	onEdit: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onClose: () => void;
}

/**
 * Component for habit action menu (⋮)
 */
export class HabitMenu extends HTMLElementComponent {
	private props: HabitMenuProps;
	private menuElement?: HTMLElement;

	constructor(props: HabitMenuProps) {
		super();
		this.props = props;
	}

	render(): HTMLElement {
		const menu = document.createElement("div");
		menu.className = "habit-menu";
		menu.style.cssText = `
			position: fixed;
			background-color: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
			z-index: 10000;
			min-width: 150px;
			padding: 4px 0;
		`;

		const menuItems = [
			{ label: "Edit Habit", action: this.props.onEdit },
			{ label: "Duplicate", action: this.props.onDuplicate },
			{ label: "Delete Habit", action: this.props.onDelete, isDestructive: true }
		];

		menuItems.forEach(item => {
			const menuItem = document.createElement("div");
			menuItem.className = "habit-menu-item";
			menuItem.textContent = item.label;
			menuItem.style.cssText = `
				padding: 8px 16px;
				cursor: pointer;
				font-size: 13px;
				color: ${item.isDestructive ? 'var(--text-error)' : 'var(--text-normal)'};
				transition: background-color 0.2s;
			`;

			menuItem.addEventListener("mouseenter", () => {
				menuItem.style.backgroundColor = "var(--background-modifier-hover)";
			});

			menuItem.addEventListener("mouseleave", () => {
				menuItem.style.backgroundColor = "transparent";
			});

			menuItem.addEventListener("click", (e) => {
				e.stopPropagation();
				item.action();
				// Remove menu from DOM
				if (this.menuElement) {
					this.menuElement.remove();
					const menuManager = MenuManager.getInstance();
					menuManager.clearActiveMenu();
				}
				this.props.onClose();
			});

			menu.appendChild(menuItem);
		});

		this.menuElement = menu;
		return menu;
	}

	/**
	 * Shows the menu at a specific position
	 */
	show(buttonRect: DOMRect, container: HTMLElement): void {
		// Close any existing menu first
		const menuManager = MenuManager.getInstance();
		menuManager.setActiveMenu(this.render());
		
		const menu = this.menuElement || this.render();
		
		// Calculate position to appear to the left of the button
		const menuWidth = 150; // min-width from CSS
		const x = buttonRect.left - menuWidth - 8; // 8px gap
		const y = buttonRect.top;
		
		// Ensure menu stays within viewport bounds
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		
		let finalX = x;
		let finalY = y;
		
		// If menu would go off left edge, show it to the right instead
		if (finalX < 0) {
			finalX = buttonRect.right + 8;
		}
		
		// If menu would go off right edge, adjust
		if (finalX + menuWidth > viewportWidth) {
			finalX = viewportWidth - menuWidth - 8;
		}
		
		// If menu would go off bottom edge, adjust
		const menuHeight = menu.offsetHeight || 120; // estimated height
		if (finalY + menuHeight > viewportHeight) {
			finalY = viewportHeight - menuHeight - 8;
		}
		
		menu.style.left = `${finalX}px`;
		menu.style.top = `${finalY}px`;
		
		document.body.appendChild(menu);

		// Close menu when clicking outside
		const closeMenu = (e: MouseEvent) => {
			if (!menu.contains(e.target as Node)) {
				menu.remove();
				document.removeEventListener("click", closeMenu);
				menuManager.clearActiveMenu();
				this.props.onClose();
			}
		};

		// Close menu on Escape key
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				menu.remove();
				document.removeEventListener("keydown", closeOnEscape);
				menuManager.clearActiveMenu();
				this.props.onClose();
			}
		};

		// Add event listeners
		setTimeout(() => {
			document.addEventListener("click", closeMenu);
			document.addEventListener("keydown", closeOnEscape);
		}, 10);
	}
}