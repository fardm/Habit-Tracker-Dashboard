export interface RGBColor {
	r: number;
	g: number;
	b: number;
	alpha?: number;
}

const clamp = (value: number, min = 0, max = 255): number =>
	Math.min(max, Math.max(min, Math.round(value)));

const parseHexColor = (hex: string): RGBColor | null => {
	const normalized = hex.trim().toLowerCase();
	if (!normalized.startsWith("#")) {
		return null;
	}

	const raw = normalized.slice(1);
	if (raw.length === 3 || raw.length === 4) {
		const [r, g, b, a] = raw.split("");
		return {
			r: parseInt(r + r, 16),
			g: parseInt(g + g, 16),
			b: parseInt(b + b, 16),
			alpha: a ? parseInt(a + a, 16) / 255 : 1
		};
	}

	if (raw.length === 6 || raw.length === 8) {
		return {
			r: parseInt(raw.slice(0, 2), 16),
			g: parseInt(raw.slice(2, 4), 16),
			b: parseInt(raw.slice(4, 6), 16),
			alpha: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1
		};
	}

	return null;
};

const toRgbaString = ({ r, g, b, alpha = 1 }: RGBColor): string =>
	`rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${Math.max(0, Math.min(1, alpha))})`;

export const createTranslucentColor = (color: string, alpha: number): string => {
	const parsed = parseHexColor(color);
	if (!parsed) {
		return color;
	}

	return toRgbaString({
		...parsed,
		alpha: Math.max(0, Math.min(1, alpha))
	});
};
