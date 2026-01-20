export interface RGBColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * Helper to convert hex string to RGBColor.
 * Supports #RRGGBB and #RRGGBBAA.
 */
function hex(hex: string): RGBColor {
    hex = hex.replace(/^#/, "");
    if (hex.length === 6) {
        // Full opacity if not specified
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: 255,
        };
    } else if (hex.length === 8) {
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: parseInt(hex.substring(6, 8), 16),
        };
    }
    // Fallback/Error
    return { r: 255, g: 0, b: 255, a: 255 };
}

export const PALETTES: Record<string, RGBColor[]> = {
    grayscale: [
        { r: 0, g: 0, b: 0, a: 0 },
        { r: 255, g: 255, b: 255, a: 255 },
        { r: 200, g: 200, b: 200, a: 255 },
        { r: 150, g: 150, b: 150, a: 255 },
        { r: 100, g: 100, b: 100, a: 255 },
        { r: 50, g: 50, b: 50, a: 255 },
        { r: 25, g: 25, b: 25, a: 255 },
        { r: 0, g: 0, b: 0, a: 255 },
    ],
    DEFAULT: [
        "#00000000",
        "#9c9c9c",
        "#9c9c9c",
        "#787878",
        "#585858",
        "#000000",
        "#00000000",
        "#00000000"
    ].map(hex),
    GOLD: [
        "#00000000",
        "#f4e020",
        "#d0c01c",
        "#a88c10",
        "#5c3000",
        "#000000",
        "#00000000",
        "#00000000"
    ].map(hex),
    RED: [
        "#00000000",
        "#fc0000",
        "#fc0000",
        "#b80000",
        "#b80000",
        "#000000",
        "#ffffff", // Fixed short #fff to full #ffffff for parser
        "#ffffff",
    ].map(hex),
    WHITE: [
        "#00000000",
        "#fcf8f0",
        "#fcf8f0",
        "#a0a0a4",
        "#646464",
        "#000000",
        "#000000",
        "#000000"
    ].map(hex),
};

export const DEFAULT_PALETTE_NAME = "DEFAULT";

/**
 * Gets a palette by name or returns the default one.
 */
export function getPalette(name?: string): RGBColor[] {
    if (name && PALETTES[name]) {
        return PALETTES[name];
    }
    return PALETTES[DEFAULT_PALETTE_NAME];
}
