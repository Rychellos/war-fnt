type War2FontHeader = {
    lowIndex: number;
    highIndex: number;
    totalChars: number;
    maxHeight: number;
    maxWidth: number;
};
interface BMFontInfo {
    fontSize: number;
    smooth: boolean;
    unicode: boolean;
    italic: boolean;
    bold: boolean;
    fixedHeight?: boolean;
    charSet?: number;
    stretchH: number;
    aa: number;
    padding: [number, number, number, number];
    spacing: [number, number];
    outline: number;
    fontName: string;
}
interface BMFontCommon {
    lineHeight: number;
    base: number;
    scaleW: number;
    scaleH: number;
    pages: number;
    packed: boolean;
    alphaChnl: number;
    redChnl: number;
    greenChnl: number;
    blueChnl: number;
}
interface BMFontChar {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    xoffset: number;
    yoffset: number;
    xadvance: number;
    page: number;
    chnl: number;
}
interface BMFontKerningPair {
    first: number;
    second: number;
    amount: number;
}
interface BMFontData {
    info: BMFontInfo;
    common: BMFontCommon;
    pages: string[];
    chars: BMFontChar[];
    kernings?: BMFontKerningPair[];
}

/**
 * Utility class used to manage each individual char
 */
declare class FontChar {
    readonly charCode: number;
    private _width;
    private _height;
    xOffset: number;
    yOffset: number;
    atlasX: number;
    atlasY: number;
    private _data;
    constructor(charCode: number, // Read-only, no setter needed
    _width: number, _height: number, xOffset?: number, yOffset?: number, atlasX?: number, atlasY?: number);
    private adjustData;
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    get data(): Uint8Array<ArrayBufferLike>;
}

declare class War2Font {
    private charSpacing;
    private static readonly FONT_IDENTIFIER;
    private static readonly PALETTE_INDEX_LIMIT;
    private view;
    private cursor;
    private chars;
    private header;
    private atlasSize;
    private pixelData;
    constructor(charSpacing?: number);
    static fromBuffer(buffer: ArrayBuffer, charSpacing?: number): War2Font;
    /**
     * Creates a War2Font instance from a list of FontChar objects.
     */
    static fromGlyphs(chars: FontChar[], charSpacing?: number): War2Font;
    private parseBuffer;
    write(): Uint8Array;
    private recalculateHeader;
    private compressChar;
    /**
     * The data is palette index (0-7) in all color channels (RGB)
     * and apha of 255.
     *
     * For example one pixel with color index 4 would be: [4, 4, 4, 255]
     * This property can be useful for debugging.
     */
    getPixelData(): Uint8Array<ArrayBuffer> | null;
    getChars(): FontChar[];
    getHeader(): War2FontHeader;
    getAtlasSize(): {
        width: number;
        height: number;
    };
    private readHeader;
    private readOffsetsToCharData;
    private getCharsDetails;
    private readPixelData;
    private addSpaceChar;
    private calculateApproxAtlasWidth;
    private calculateAtlasSizeAndPlaceChars;
    private generateAtlasTexture;
    private drawCharPixels;
    static fromBMFont(bmFontDesc: string, imageData: {
        width: number;
        height: number;
        data: Uint8Array;
    }, palette: {
        r: number;
        g: number;
        b: number;
        a: number;
    }[]): War2Font;
}

/**
 * BMFontTextWriter
 *
 * Function used to encode string version of AngelCode's BMFont format
 * https://angelcode.com/products/bmfont/
 */
declare function encodeBMF(data: BMFontData): Uint8Array<ArrayBuffer>;

interface RGBColor {
    r: number;
    g: number;
    b: number;
    a: number;
}
declare const PALETTES: Record<string, RGBColor[]>;
declare const DEFAULT_PALETTE_NAME = "DEFAULT";
/**
 * Gets a palette by name or returns the default one.
 */
declare function getPalette(name?: string): RGBColor[];

/**
 *
 * @param data Raw data of the Blizzard's .fnt file
 * @param fontName Name that can be user to identify font in app's font context, e.g. "font_header"
 * @param fileName Name that will be used to load image file, e.g. "font.png"
 */
declare function fntToBMFontAndPixelData(data: ArrayBuffer, fontName: string, fileName: string, characterSpacing?: number): {
    pixelData: Uint8Array<ArrayBuffer> | null;
    BMFTextBuffer: Uint8Array<ArrayBuffer>;
    size: {
        width: number;
        height: number;
    };
};

export { type BMFontChar, type BMFontCommon, type BMFontData, type BMFontInfo, type BMFontKerningPair, DEFAULT_PALETTE_NAME, FontChar, PALETTES, type RGBColor, War2Font, type War2FontHeader, encodeBMF, fntToBMFontAndPixelData, getPalette };
