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
		const menu = createDiv({ cls: "habit-menu" });

		const menuItems = [
			{ label: "Edit Habit", action: this.props.onEdit },
			{ label: "Duplicate", action: this.props.onDuplicate },
			{ label: "Delete Habit", action: this.props.onDelete, isDestructive: true }
		];

		menuItems.forEach(item => {
			const menuItem = createDiv({
				cls: item.isDestructive ? "habit-menu-item habit-menu-item-destructive" : "habit-menu-item",
				text: item.label
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
	show(buttonRect: DOMRect): void {
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
		window.setTimeout(() => {
			document.addEventListener("click", closeMenu);
			document.addEventListener("keydown", closeOnEscape);
		}, 10);
	}
}