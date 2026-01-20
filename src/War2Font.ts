import { FontChar } from "./FontChar";
import { War2FontHeader } from "./types";

export class War2Font {
    private static readonly FONT_IDENTIFIER = 1414418246; // "FONT"
    private static readonly PALETTE_INDEX_LIMIT = 8;

    private view: DataView;
    private cursor: number = 0;
    private chars: FontChar[] = [];
    private header: War2FontHeader;
    private atlasSize = {
        width: 0,
        height: 0,
    };

    private pixelData: Uint8Array<ArrayBuffer> | null = null;

    constructor(private charSpacing = 1) {
        this.view = new DataView(new ArrayBuffer(0));
        this.header = {
            highIndex: 0,
            lowIndex: 0,
            maxHeight: 0,
            maxWidth: 0,
            totalChars: 0,
        };
    }

    public static fromBuffer(
        buffer: ArrayBuffer,
        charSpacing = 1,
    ): War2Font {
        const font = new War2Font(charSpacing);
        font.parseBuffer(buffer);
        return font;
    }

    /**
     * Creates a War2Font instance from a list of FontChar objects.
     */
    public static fromGlyphs(
        chars: FontChar[],
        charSpacing = 1,
    ): War2Font {
        const font = new War2Font(charSpacing);
        font.chars = chars;
        font.recalculateHeader();
        font.calculateAtlasSizeAndPlaceChars();
        font.pixelData = font.generateAtlasTexture();
        return font;
    }

    private parseBuffer(buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
        this.header = this.readHeader();
        this.chars = this.getCharsDetails();
        this.addSpaceChar();
        this.calculateAtlasSizeAndPlaceChars();
        this.pixelData = this.generateAtlasTexture();
    }

    /*
     * Validates and returns the binary font file.
     */
    public write(): Uint8Array {
        // Recalculate header based on chars
        this.recalculateHeader();

        const chunks: Uint8Array[] = [];

        // 1. Write Header
        const headerBuffer = new ArrayBuffer(8);
        const headerView = new DataView(headerBuffer);
        headerView.setInt32(0, War2Font.FONT_IDENTIFIER, true);
        headerView.setUint8(4, this.header.lowIndex);
        headerView.setUint8(5, this.header.highIndex);
        headerView.setUint8(6, this.header.maxWidth);
        headerView.setUint8(7, this.header.maxHeight);
        chunks.push(new Uint8Array(headerBuffer));

        // 2. Prepare Chars Data and Offsets
        const offsetsBuffer = new ArrayBuffer(this.header.totalChars * 4);
        const offsetsView = new DataView(offsetsBuffer);
        const charDataChunks: Uint8Array[] = [];

        let currentOffset = 8 + this.header.totalChars * 4;

        for (let i = 0; i < this.header.totalChars; i++) {
            const charCode = this.header.lowIndex + i;
            const char = this.chars.find((c) => c.charCode === charCode);

            if (!char) {
                // Char not present, offset 0
                offsetsView.setUint32(i * 4, 0, true);
                continue;
            }

            offsetsView.setUint32(i * 4, currentOffset, true);

            // Compress char data
            const compressed = this.compressChar(char);
            charDataChunks.push(compressed);
            currentOffset += compressed.byteLength;
        }

        chunks.push(new Uint8Array(offsetsBuffer));
        chunks.push(...charDataChunks);

        // Combine all chunks
        const totalLength = chunks.reduce(
            (acc, chunk) => acc + chunk.byteLength,
            0,
        );
        const result = new Uint8Array(totalLength);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.byteLength;
        }

        return result;
    }

    private recalculateHeader() {
        if (this.chars.length === 0) return;

        // Sort chars
        this.chars.sort((a, b) => a.charCode - b.charCode);

        const minCode = this.chars[0].charCode;
        const maxCode = this.chars[this.chars.length - 1].charCode;
        let maxWidth = 0;
        let maxHeight = 0;

        for (const char of this.chars) {
            if (char.width > maxWidth) maxWidth = char.width;
            if (char.height > maxHeight) maxHeight = char.height;
        }

        this.header = {
            lowIndex: minCode,
            highIndex: maxCode,
            totalChars: maxCode - minCode + 1,
            maxWidth,
            maxHeight,
        };
    }

    private compressChar(char: FontChar): Uint8Array {
        const header = new Uint8Array(4);
        header[0] = char.width;
        header[1] = char.height;
        // int8
        new DataView(header.buffer).setInt8(2, char.xOffset);
        new DataView(header.buffer).setInt8(3, char.yOffset);

        const pixelData: number[] = [];
        const rawPixels = char.data;
        const totalPixels = char.width * char.height;

        let skipCount = 0;
        for (let i = 0; i < totalPixels; i++) {
            const val = rawPixels[i];
            if (val === 0) {
                skipCount++;
            } else {
                while (skipCount > 31) {
                    pixelData.push(248);
                    skipCount -= 32;
                }

                pixelData.push(skipCount * War2Font.PALETTE_INDEX_LIMIT + val);
                skipCount = 0;
            }
        }

        // Handle trailing zeros
        while (skipCount > 0) {
            const count = Math.min(skipCount, 32);
            pixelData.push((count - 1) * War2Font.PALETTE_INDEX_LIMIT);
            skipCount -= count;
        }

        const combined = new Uint8Array(4 + pixelData.length);
        combined.set(header, 0);
        combined.set(pixelData, 4);
        return combined;
    }

    /**
     * The data is palette index (0-7) in all color channels (RGB)
     * and apha of 255.
     *
     * For example one pixel with color index 4 would be: [4, 4, 4, 255]
     * This property can be useful for debugging.
     */
    public getPixelData(): Uint8Array<ArrayBuffer> | null {
        return this.pixelData;
    }

    public getChars(): FontChar[] {
        return this.chars;
    }

    public getHeader(): War2FontHeader {
        return this.header;
    }

    public getAtlasSize() {
        return this.atlasSize;
    }

    private readHeader() {
        if (this.view.getInt32(0, true) !== War2Font.FONT_IDENTIFIER) {
            throw new Error(
                `[War2Font] No valid file format.\nExpected: ${War2Font.FONT_IDENTIFIER}, but got: ${this.view.getInt32(
                    0,
                    true,
                )}`,
            );
        }

        this.cursor = 4;

        const lowIndex = this.view.getUint8(this.cursor++);
        const highIndex = this.view.getUint8(this.cursor++);
        const maxWidth = this.view.getUint8(this.cursor++);
        const maxHeight = this.view.getUint8(this.cursor++);

        return {
            lowIndex,
            highIndex,
            totalChars: highIndex - lowIndex + 1,
            maxHeight,
            maxWidth,
        };
    }

    private readOffsetsToCharData() {
        const offsets = [];

        for (let i = 0; i < this.header.totalChars; i++) {
            offsets.push(this.view.getUint32(this.cursor, true));
            this.cursor += 4;
        }

        return offsets;
    }

    private getCharsDetails(): FontChar[] {
        const offsets = this.readOffsetsToCharData();
        const chars: FontChar[] = [];

        for (let index = 0; index < offsets.length; index++) {
            const offset = offsets[index];

            if (offset === 0) continue;

            const char = new FontChar(
                this.header.lowIndex + index,
                this.view.getUint8(offset),
                this.view.getUint8(offset + 1),
                this.view.getInt8(offset + 2),
                this.view.getInt8(offset + 3),
            );

            this.readPixelData(char, offset + 4);

            chars.push(char);
        }

        return chars;
    }

    private readPixelData(char: FontChar, readCursor: number) {
        let pixelIndex = 0;
        const totalPixels = char.width * char.height;

        while (pixelIndex < totalPixels) {
            let paletteColorIndex = this.view.getUint8(readCursor++);

            // Compression logic
            while (paletteColorIndex >= War2Font.PALETTE_INDEX_LIMIT) {
                paletteColorIndex -= War2Font.PALETTE_INDEX_LIMIT;
                pixelIndex++;

                if (pixelIndex >= totalPixels) {
                    return;
                }
            }

            const data = char.data;

            data[pixelIndex] = paletteColorIndex;

            pixelIndex++;
        }
    }

    //Blizzard's format doesn't register space so we add one manually
    private addSpaceChar() {
        if (!this.chars.find((c) => c.charCode === 32)) {
            this.chars.push(new FontChar(32, this.header.maxWidth, 0));
        }
    }

    private calculateApproxAtlasWidth(): number {
        let area = 0;

        for (let index = 0; index < this.chars.length; index++) {
            const char = this.chars[index];

            if (!char) {
                continue;
            }

            area +=
                (char.width + this.charSpacing) *
                (char.height + this.charSpacing);
        }

        let atlasWidth = Math.ceil(Math.sqrt(area));
        // WEBGL without extensions needs multiple of 4 texture width
        return Math.pow(4, Math.ceil(Math.log(atlasWidth) / Math.log(4)));
    }

    private calculateAtlasSizeAndPlaceChars() {
        const atlasWidth = this.calculateApproxAtlasWidth();

        let currentX = 0;
        let currentY = 0;
        let rowHeight = 0;

        for (let index = 0; index < this.chars.length; index++) {
            const char = this.chars[index];

            if (!char) {
                continue;
            }

            if (currentX + char.width > atlasWidth) {
                currentX = 0;
                currentY += rowHeight + this.charSpacing;
                rowHeight = 0;
            }

            char.atlasX = currentX;
            char.atlasY = currentY;

            currentX += char.width + this.charSpacing;

            if (char.height > rowHeight) {
                rowHeight = char.height;
            }
        }

        const atlasHeight = currentY + rowHeight;

        this.atlasSize = {
            width: atlasWidth,
            height: atlasHeight,
        };
    }

    private generateAtlasTexture() {
        const pixelData = new Uint8Array(
            this.atlasSize.width * this.atlasSize.height,
        );

        this.chars.sort((a, b) => a.charCode - b.charCode);

        this.chars.forEach((char) => {
            if (char.charCode === 32 || char.charCode === 160) {
                return;
            }

            this.drawCharPixels(char, pixelData);
        });

        return new Uint8Array(pixelData.buffer);
    }

    private drawCharPixels(char: FontChar, targetData: Uint8Array) {
        for (let y = 0; y < char.height; y++) {
            for (let x = 0; x < char.width; x++) {
                const val = char.data[y * char.width + x];

                targetData[
                    (y + char.atlasY) * this.atlasSize.width + x + char.atlasX
                ] = val;
            }
        }
    }

    public static fromBMFont(
        bmFontDesc: string,
        imageData: { width: number; height: number; data: Uint8Array },
        palette: { r: number; g: number; b: number; a: number }[],
    ): War2Font {
        const font = new War2Font();
        const lines = bmFontDesc.split(/\r?\n/);

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith("char ")) {
                const charProps = trimmed.split(/\s+/).slice(1);
                const props: Record<string, number> = {};

                for (const prop of charProps) {
                    const [key, val] = prop.split("=");
                    if (key && val) {
                        props[key] = parseInt(val, 10);
                    }
                }

                const id = props["id"] ?? 0;
                const x = props["x"] ?? 0;
                const y = props["y"] ?? 0;
                const width = props["width"] ?? 0;
                const height = props["height"] ?? 0;
                const xoffset = props["xoffset"] ?? 0;
                const yoffset = props["yoffset"] ?? 0;

                if (width === 0 || height === 0) continue;

                // Create FontChar
                const char = new FontChar(id, width, height, xoffset, yoffset);

                // Extract pixels
                const charData = char.data;
                for (let py = 0; py < height; py++) {
                    const destRow = py * width;
                    const srcRowBase = (y + py) * imageData.width + x;

                    for (let px = 0; px < width; px++) {
                        const srcIdx = (srcRowBase + px) * 4;
                        if (srcIdx >= imageData.data.length) continue;

                        const r = imageData.data[srcIdx];
                        const g = imageData.data[srcIdx + 1];
                        const b = imageData.data[srcIdx + 2];
                        const a = imageData.data[srcIdx + 3];

                        // Find closest palette index
                        let bestIdx = 0;
                        let bestDist = Infinity;

                        // Iterate all palette entries
                        for (let pid = 0; pid < palette.length; pid++) {
                            const p = palette[pid];
                            // Simple Euclidean distance
                            const dist = Math.sqrt(
                                Math.pow(r - p.r, 2) +
                                Math.pow(g - p.g, 2) +
                                Math.pow(b - p.b, 2) +
                                Math.pow(a - p.a, 2),
                            );
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestIdx = pid;
                            }
                        }

                        charData[destRow + px] = bestIdx;
                    }
                }

                font.chars.push(char);
            }
        }

        font.recalculateHeader();
        font.calculateAtlasSizeAndPlaceChars();
        font.pixelData = font.generateAtlasTexture();

        return font;
    }
}
