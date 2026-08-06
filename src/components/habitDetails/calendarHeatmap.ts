import { HTMLElementComponent } from "../htmlElementComponent";
import { CalendarHeatmapProps, HeatmapSettings, ColorScaleMode, ReportPeriod } from "../../types/habitDetailsTypes";
import { setIcon } from "obsidian";
import {
	CalendarDateAdapter,
	getCalendarAdapter,
	parseLocalISODate,
	toLocalISODate,
	YearHeatmapLayout
} from "../../utils/calendarAdapter";
import { ReportCalendar, WeekStartDay } from "../../types/habitTypes";

/**
 * CalendarHeatmap — GitHub-style yearly activity grid.
 * Columns = weeks, rows = days of week (order depends on weekStartDay).
 * Year bounds come from the calendar adapter (Jan–Dec or Farvardin–Esfand).
 */
export class CalendarHeatmap extends HTMLElementComponent {
	private props: CalendarHeatmapProps;
	private settings: HeatmapSettings;
	private isMenuOpen = false;
	private heatmapContainer?: HTMLElement;
	private gridBlock?: HTMLElement;
	private legendElement?: HTMLElement;

	constructor(props: CalendarHeatmapProps) {
		super();
		this.props = props;
		this.settings = props.heatmapSettings || this.getDefaultSettings();
	}

	private getThemeColor(): string {
		return this.props.theme?.primary || "var(--interactive-accent)";
	}

	private getDefaultSettings(): HeatmapSettings {
		return {
			weekStartDay: WeekStartDay.SUNDAY,
			showMonthLabels: false,
			colorScaleMode: ColorScaleMode.AUTOMATIC,
			colorScaleMin: 0,
			colorScaleMax: 60
		};
	}

	private getWeekStartDay(): WeekStartDay {
		return this.settings.weekStartDay ?? WeekStartDay.SUNDAY;
	}

	private adjustColorLightness(color: string, lightnessFactor: number): string {
		// Convert hex to RGB
		let r: number, g: number, b: number;
		
		if (color.startsWith("#")) {
			r = parseInt(color.slice(1, 3), 16);
			g = parseInt(color.slice(3, 5), 16);
			b = parseInt(color.slice(5, 7), 16);
		} else if (color.startsWith("rgb(")) {
			const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
			if (match) {
				r = parseInt(match[1]);
				g = parseInt(match[2]);
				b = parseInt(match[3]);
			} else {
				return color;
			}
		} else {
			// For CSS variables, return as-is
			return color;
		}

		// Convert RGB to HSL
		const rNorm = r / 255;
		const gNorm = g / 255;
		const bNorm = b / 255;

		const max = Math.max(rNorm, gNorm, bNorm);
		const min = Math.min(rNorm, gNorm, bNorm);
		let h = 0, s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			
			switch (max) {
				case rNorm:
					h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
					break;
				case gNorm:
					h = ((bNorm - rNorm) / d + 2) / 6;
					break;
				case bNorm:
					h = ((rNorm - gNorm) / d + 4) / 6;
					break;
			}
		}

		// Adjust lightness: lightnessFactor 0 = lightest, 1 = darkest
		// We want lower values to be lighter, higher values to be darker
		// So higher lightnessFactor = lower lightness value = darker color
		// Interpolate between light (0.9) and dark (0.3)
		const adjustedL = 0.9 - lightnessFactor * 0.6;

		// Convert HSL back to RGB
		const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s;
		const p = 2 * adjustedL - q;

		const rNew = Math.round(this.hueToRgb(p, q, h + 1/3) * 255);
		const gNew = Math.round(this.hueToRgb(p, q, h) * 255);
		const bNew = Math.round(this.hueToRgb(p, q, h - 1/3) * 255);

		return `rgb(${rNew}, ${gNew}, ${bNew})`;
	}

	private hueToRgb(p: number, q: number, t: number): number {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1/6) return p + (q - p) * 6 * t;
		if (t < 1/2) return q;
		if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	render(): HTMLElement {
		const container = createDiv({ cls: "calendar-heatmap" });
		// Container styling is handled by CSS

		// Header with title
		const header = createDiv({ cls: "calendar-heatmap-header" });

		const title = createEl("h3", {
			cls: "calendar-heatmap-title",
			text: "Activity Heatmap"
		});
		header.appendChild(title);
		container.appendChild(header);

		// Menu button - positioned absolutely
		const menuButton = createEl("button", {
			cls: "calendar-heatmap-menu-button clickable-icon",
			type: "button",
			attr: { title: "Heatmap Settings" }
		});
		setIcon(menuButton, "more-vertical");
		// Hover states are handled by CSS

		menuButton.addEventListener("click", (e) => {
			e.stopPropagation();
			this.isMenuOpen = !this.isMenuOpen;
			this.toggleMenu();
		});

		container.appendChild(menuButton);

		// Settings dropdown
		const menuDropdown = this.createSettingsMenu();
		container.appendChild(menuDropdown);

		// Create heatmap container
		this.heatmapContainer = createDiv({ cls: "heatmap-container" });
		// Heatmap container styling is handled by CSS

		this.updateHeatmapContent();
		container.appendChild(this.heatmapContainer);

		// Close menu when clicking outside
		document.addEventListener("click", (e) => {
			if (this.isMenuOpen && !container.contains(e.target as Node)) {
				this.isMenuOpen = false;
				this.toggleMenu();
			}
		});

		return container;
	}

	private createHeader(): HTMLElement {
		// Header is now created inline in render()
		return createDiv();
	}

	private createSettingsMenu(): HTMLElement {
		const menu = createDiv({
			cls: "heatmap-settings-menu",
			attr: { id: "heatmap-settings-menu" }
		});
		// Menu styling is handled by CSS

		// Week start day setting
		const weekStartLabel = createEl("label", {
			cls: "heatmap-settings-label",
			text: "Week start day"
		});
		menu.appendChild(weekStartLabel);

		const weekStartSelect = createEl("select", {
			cls: "heatmap-settings-select"
		});

		[WeekStartDay.SUNDAY, WeekStartDay.MONDAY, WeekStartDay.SATURDAY].forEach(day => {
			const option = createEl("option", {
				value: String(day),
				text: day === WeekStartDay.SUNDAY ? "Sunday" : day === WeekStartDay.MONDAY ? "Monday" : "Saturday"
			});
			option.selected = this.settings.weekStartDay === day;
			weekStartSelect.appendChild(option);
		});

		weekStartSelect.addEventListener("change", () => {
			this.settings.weekStartDay = Number(weekStartSelect.value);
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		menu.appendChild(weekStartSelect);

		// Month labels setting
		const monthLabelsContainer = createDiv({ cls: "heatmap-settings-row" });

		const monthLabelsLabel = createEl("label", {
			cls: "heatmap-settings-label-inline",
			text: "Show month labels"
		});

		const monthLabelsToggle = createEl("input", {
			cls: "heatmap-settings-checkbox",
			type: "checkbox"
		});
		monthLabelsToggle.checked = this.settings.showMonthLabels ?? false;

		monthLabelsToggle.addEventListener("change", () => {
			this.settings.showMonthLabels = monthLabelsToggle.checked;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		monthLabelsContainer.appendChild(monthLabelsLabel);
		monthLabelsContainer.appendChild(monthLabelsToggle);
		menu.appendChild(monthLabelsContainer);

		// Color scale mode setting
		const colorScaleLabel = createEl("label", {
			cls: "heatmap-settings-label",
			text: "Color scale mode"
		});
		menu.appendChild(colorScaleLabel);

		const colorScaleContainer = createDiv({ cls: "heatmap-settings-column" });

		[ColorScaleMode.AUTOMATIC, ColorScaleMode.MANUAL].forEach(mode => {
			const radioContainer = createDiv({ cls: "heatmap-settings-radio-row" });

			const radio = createEl("input", {
				cls: "heatmap-settings-radio",
				type: "radio",
				value: mode
			});
			radio.name = "colorScaleMode";
			radio.checked = this.settings.colorScaleMode === mode;

			radio.addEventListener("change", () => {
				this.settings.colorScaleMode = mode;
				this.notifySettingsChange();
				this.updateHeatmapContent();
				this.updateManualFieldsVisibility();
			});

			const label = createEl("label", {
				cls: "heatmap-settings-radio-label",
				text: mode === ColorScaleMode.AUTOMATIC ? "Automatic" : "Manual"
			});

			radioContainer.appendChild(radio);
			radioContainer.appendChild(label);
			colorScaleContainer.appendChild(radioContainer);
		});

		menu.appendChild(colorScaleContainer);

		// Manual scale fields (shown only when manual mode is selected)
		const manualFieldsContainer = createDiv({
			cls: "heatmap-settings-manual-fields",
			attr: { id: "manual-scale-fields" }
		});
		if (this.settings.colorScaleMode !== ColorScaleMode.MANUAL) {
			manualFieldsContainer.classList.add("hidden");
		}

		// Minimum value field
		const minFieldContainer = createDiv({ cls: "heatmap-settings-field-group" });

		const minLabel = createEl("label", {
			cls: "heatmap-settings-field-label",
			text: "Minimum value"
		});

		const minInput = createEl("input", {
			cls: "heatmap-settings-input",
			type: "number",
			value: String(this.settings.colorScaleMin ?? 0)
		});

		minInput.addEventListener("change", () => {
			this.settings.colorScaleMin = parseFloat(minInput.value) || 0;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		minFieldContainer.appendChild(minLabel);
		minFieldContainer.appendChild(minInput);
		manualFieldsContainer.appendChild(minFieldContainer);

		// Maximum value field
		const maxFieldContainer = createDiv({ cls: "heatmap-settings-field-group" });

		const maxLabel = createEl("label", {
			cls: "heatmap-settings-field-label",
			text: "Maximum value"
		});

		const maxInput = createEl("input", {
			cls: "heatmap-settings-input",
			type: "number",
			value: String(this.settings.colorScaleMax ?? 60)
		});

		maxInput.addEventListener("change", () => {
			this.settings.colorScaleMax = parseFloat(maxInput.value) || 60;
			this.notifySettingsChange();
			this.updateHeatmapContent();
		});

		maxFieldContainer.appendChild(maxLabel);
		maxFieldContainer.appendChild(maxInput);
		manualFieldsContainer.appendChild(maxFieldContainer);

		menu.appendChild(manualFieldsContainer);

		// Hide color scale settings for boolean habits
		if (this.props.habitType === "boolean") {
			colorScaleLabel.classList.add("hidden");
			colorScaleContainer.classList.add("hidden");
			manualFieldsContainer.classList.add("hidden");
		}

		return menu;
	}

	private toggleMenu(): void {
		const menu = document.getElementById("heatmap-settings-menu");
		if (menu) {
			if (this.isMenuOpen) {
				menu.classList.remove("hidden");
				menu.classList.add("visible");
				// Trigger reflow to enable transition
				void menu.offsetHeight;
				menu.classList.add("heatmap-settings-menu-visible");
			} else {
				menu.classList.remove("heatmap-settings-menu-visible");
				// Wait for transition to complete before hiding
				window.setTimeout(() => {
					if (!this.isMenuOpen) {
						menu.classList.remove("visible");
						menu.classList.add("hidden");
					}
				}, 200);
			}
		}
	}

	private updateManualFieldsVisibility(): void {
		const manualFields = document.getElementById("manual-scale-fields");
		if (manualFields) {
			if (this.settings.colorScaleMode === ColorScaleMode.MANUAL) {
				manualFields.classList.remove("hidden");
				manualFields.classList.add("visible");
			} else {
				manualFields.classList.remove("visible");
				manualFields.classList.add("hidden");
			}
		}
	}

	private updateHeatmapContent(): void {
		if (!this.heatmapContainer) return;

		this.heatmapContainer.empty();

		const adapter = getCalendarAdapter(
			this.props.reportCalendar || ReportCalendar.GREGORIAN
		);
		const year = this.props.year ?? adapter.getCurrentYear();
		const period = this.props.period ?? ReportPeriod.YEAR;
		const weekStartDay = this.getWeekStartDay();
		
		// Determine date range based on period
		let startDate: Date;
		let endDate: Date;
		
		switch (period) {
			case ReportPeriod.MONTH:
				startDate = adapter.getMonthStart(year, this.props.month ?? adapter.getCurrentMonth());
				endDate = adapter.getMonthEnd(year, this.props.month ?? adapter.getCurrentMonth());
				break;
			case ReportPeriod.WEEK:
				startDate = adapter.getWeekStart(year, this.props.weekNumber ?? 1);
				endDate = adapter.getWeekEnd(year, this.props.weekNumber ?? 1);
				break;
			case ReportPeriod.YEAR:
			default:
				startDate = adapter.getYearStart(year);
				endDate = adapter.getYearEnd(year);
				break;
		}
		
		const layout = adapter.buildYearHeatmapLayout(year, weekStartDay);

		this.gridBlock = createDiv({ cls: "heatmap-grid-block" });

		if (this.settings.showMonthLabels && period === ReportPeriod.YEAR) {
			this.gridBlock.appendChild(
				this.createMonthLabelsRow(layout.monthLabels, layout.weeksCount)
			);
		}

		this.gridBlock.appendChild(this.createHeatmapGrid(adapter, layout, startDate, endDate));
		this.heatmapContainer.appendChild(this.gridBlock);

		this.legendElement = this.createLegend();
		this.heatmapContainer.appendChild(this.legendElement);
	}

	private notifySettingsChange(): void {
		if (this.props.onHeatmapSettingsChange) {
			this.props.onHeatmapSettingsChange(this.settings);
		}
	}

	private createMonthLabelsRow(
		monthLabels: { weekIndex: number; label: string }[],
		weeksCount: number
	): HTMLElement {
		const cellSize = 10;
		const gap = 2;
		const row = createDiv({ cls: "heatmap-month-labels" });
		row.style.setProperty("--heatmap-width", `${weeksCount * cellSize + Math.max(0, weeksCount - 1) * gap}px`);
		// Other styles handled by CSS

		for (const label of monthLabels) {
			const el = createSpan({ cls: "heatmap-month-label", text: label.label });
			el.style.setProperty("--label-left", `${label.weekIndex * (cellSize + gap)}px`);
			row.appendChild(el);
		}

		return row;
	}

	private buildValueMap(): Map<string, number> {
		const valueMap = new Map<string, number>();
		
		// Determine scale based on mode
		let minScale = 0;
		let maxScale = 1;
		
		if (this.settings.colorScaleMode === ColorScaleMode.MANUAL) {
			minScale = this.settings.colorScaleMin ?? 0;
			maxScale = this.settings.colorScaleMax ?? 60;
		} else {
			// Automatic mode: use actual data range
			const numericValues = this.props.values
				.map((v) => typeof v.value === "number" ? v.value : 0)
				.filter(v => v > 0);
			maxScale = Math.max(...numericValues, 1);
		}

		this.props.values.forEach((entry) => {
			const dateKey = toLocalISODate(entry.date);
			if (this.props.habitType === "boolean") {
				valueMap.set(dateKey, entry.value === true ? 1 : 0);
			} else {
				const numValue = entry.value as number;
				// Normalize to 0-1 range based on scale
				const normalized = (numValue - minScale) / (maxScale - minScale);
				valueMap.set(dateKey, Math.max(0, Math.min(1, normalized)));
			}
		});

		return valueMap;
	}

	private intensityColor(value: number, themeColor: string): string {
		if (value <= 0) {
			return "var(--background-modifier-border)";
		}
		// For boolean habits, use base theme color to match legend
		if (this.props.habitType === "boolean") {
			return themeColor;
		}
		if (value <= 0.25) {
			return this.adjustColorLightness(themeColor, 0.25);
		}
		if (value <= 0.5) {
			return this.adjustColorLightness(themeColor, 0.5);
		}
		if (value <= 0.75) {
			return this.adjustColorLightness(themeColor, 0.75);
		}
		return this.adjustColorLightness(themeColor, 1.0);
	}

	private formatTooltip(
		isoDate: string,
		value: number,
		adapter: CalendarDateAdapter
	): string {
		const displayDate = adapter.formatDisplayDate(parseLocalISODate(isoDate));
		if (this.props.habitType === "boolean") {
			return `${displayDate}: ${value > 0 ? "Completed" : "Not completed"}`;
		}
		const raw = this.props.values.find(
			(v) => toLocalISODate(v.date) === isoDate
		)?.value;
		return `${displayDate}: ${raw ?? 0}`;
	}

	private createHeatmapGrid(
		adapter: CalendarDateAdapter,
		layout: YearHeatmapLayout,
		startDate?: Date,
		endDate?: Date
	): HTMLElement {
		const { cells, weeksCount } = layout;
		const valueMap = this.buildValueMap();
		const themeColor = this.getThemeColor();

		const grid = createDiv({ cls: "heatmap-grid" });
		grid.setAttribute("data-weeks", String(weeksCount));
		grid.setAttribute("data-week-start", String(this.getWeekStartDay()));

		for (const cellData of cells) {
			const cell = createDiv();

			if (cellData.isEmpty || !cellData.isoDate) {
				cell.addClass("heatmap-cell", "heatmap-cell-empty");
				grid.appendChild(cell);
				continue;
			}

			// Filter cells based on date range if provided
			if (startDate && endDate) {
				const cellDate = parseLocalISODate(cellData.isoDate);
				if (cellDate < startDate || cellDate > endDate) {
					cell.addClass("heatmap-cell", "heatmap-cell-empty");
					grid.appendChild(cell);
					continue;
				}
			}

			const value = valueMap.get(cellData.isoDate) || 0;
			cell.addClass("heatmap-cell");
			cell.style.setProperty("--cell-bg-color", this.intensityColor(value, themeColor));
			cell.title = this.formatTooltip(cellData.isoDate, value, adapter);
			grid.appendChild(cell);
		}

		return grid;
	}

	private createLegend(): HTMLElement {
		const legend = createDiv({ cls: "heatmap-legend" });

		if (this.props.habitType === "boolean") {
			const legendItems = [
				{ label: "Done", color: this.getThemeColor(), filled: true },
				{ label: "Not done", color: "transparent", filled: false }
			];

			legendItems.forEach((item) => {
				const legendItem = createDiv({ cls: "heatmap-legend-item" });

				const square = createDiv({ cls: "heatmap-legend-square" });
				square.style.setProperty("--legend-bg-color", item.color);

				const label = createSpan({ text: item.label });
				legendItem.appendChild(square);
				legendItem.appendChild(label);
				legend.appendChild(legendItem);
			});

			return legend;
		}

		const themeColor = this.getThemeColor();
		let legendColors;

		if (this.settings.colorScaleMode === ColorScaleMode.MANUAL) {
			// Dynamic labels based on manual min/max
			const min = this.settings.colorScaleMin ?? 0;
			const max = this.settings.colorScaleMax ?? 60;
			const range = max - min;
			const step = range / 4;

			legendColors = [
				{ color: "var(--background-modifier-border)", label: `${min}` },
				{ color: this.adjustColorLightness(themeColor, 0.25), label: `${Math.round(min + step * 1)}-${Math.round(min + step * 2)}` },
				{ color: this.adjustColorLightness(themeColor, 0.5), label: `${Math.round(min + step * 2)}-${Math.round(min + step * 3)}` },
				{ color: this.adjustColorLightness(themeColor, 0.75), label: `${Math.round(min + step * 3)}-${Math.round(min + step * 4)}` },
				{ color: this.adjustColorLightness(themeColor, 1.0), label: `${Math.round(min + step * 4)}+` }
			];
		} else {
			// Percentage labels for automatic mode
			legendColors = [
				{ color: "var(--background-modifier-border)", label: "0" },
				{ color: this.adjustColorLightness(themeColor, 0.25), label: "1-25%" },
				{ color: this.adjustColorLightness(themeColor, 0.5), label: "26-50%" },
				{ color: this.adjustColorLightness(themeColor, 0.75), label: "51-75%" },
				{ color: this.adjustColorLightness(themeColor, 1.0), label: "76-100%" }
			];
		}

		const legendLabel = createSpan({ text: "Less" });
		legend.appendChild(legendLabel);

		legendColors.forEach((item) => {
			const legendItem = createDiv({ cls: "heatmap-legend-color-box" });
			legendItem.style.setProperty("--legend-box-color", item.color);
			legendItem.title = item.label;
			legend.appendChild(legendItem);
		});

		const moreLabel = createSpan({ text: "More" });
		legend.appendChild(moreLabel);

		return legend;
	}

	}
