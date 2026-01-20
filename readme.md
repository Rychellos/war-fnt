# Warcraft 2 Font Library (`war2-fnt`)

A library and CLI tool to convert [Blizzard's font files](specification.md) used in Warcraft 2 into [BMFont](https://angelcode.com/products/bmfont/) format (text + PNG) and back. It also supports splitting fonts into individual character images for easy editing.

> Special thanks to the Warcraft 2 forum community for documenting the file format. [Original post](https://forum.war2.ru/index.php?topic=4701.msg76149#msg76149)

## Features

-   **Reader**: Read `.fnt` files and convert them to BMFont format.
-   **Writer**: turn BMFont data back into binary `.fnt` files.
-   **CLI**: Command-line interface for quick conversions.
-   **Split/Stitch**: Break down fonts into individual images for pixel-perfect editing and recombine them.
-   **Palette Support**: Specify custom palettes for better previews and easier editing.

## Installation

```bash
npm install war2-fnt
# or
pnpm add war2-fnt
```

## CLI Usage

You can use the CLI directly via `npx` or after installing globally.

### 1. Unpack (`.fnt` -> BMFont + PNG)
Converts a binary font file into a standard `.fnt` descriptor and a `.png` atlas.

```bash
npx war2-fnt unpack input.fnt --output ./output --palette palette.json
```

-   `--output` (`-o`): Output directory.
-   `--palette` (`-p`): (Optional) JSON file containing an array of color objects to use given indices. If omitted, a grayscale debug palette is used.

### 2. Pack (BMFont + PNG -> `.fnt`)
Converts a BMFont file and its corresponding image atlas back into the Warcraft 2 binary format.

```bash
npx war2-fnt pack font.fnt font.png --output new_font.fnt --palette palette.json
```

### 3. Split (`.fnt` -> Single Images)
Extracts every character from the font into its own separate PNG file. Useful for manual editing.

```bash
npx war2-fnt split input.fnt --output ./chars --palette palette.json
```

Output:
-   `char_32.png`, [...], `char_65.png`, ...
-   `metadata.json` (Stores offsets and spacing info)

### 4. Stitch (Single Images -> `.fnt`)
Recombines a directory of character images and a `metadata.json` file into a binary `.fnt` file.

```bash
npx war2-fnt stitch ./chars --output new_font.fnt --palette palette.json
```

### 5. Info (`.fnt` Metadata)
Quickly inspect font metrics and glyph counts.

```bash
npx war2-fnt info input.fnt
```

### 6. Render (Text Preview)
Render a string of text into a PNG image for previewing.

```bash
# Simple text
npx war2-fnt render input.fnt "Hello World" -o preview.png

# Multi-palette JSON (Minecraft style)
npx war2-fnt render input.fnt '[{"text": "A", "palette": "grayscale"}, {"text": "B", "palette": "other"}]'
```

## Palettes

You can define your own palettes  by providing external JSON file (array of `{r, g, b, a}`). By default, the tool uses the `grayscale` palette.

## Programmatic Usage

```typescript
import { War2Font, fntToBMFontAndPixelData } from "war2-fnt";
import * as fs from "fs";

// 1. Reading a font
const buffer = fs.readFileSync("font.fnt").buffer;
const font = War2Font.fromBuffer(buffer);
const chars = font.getChars();

// 2. Converting to BMFont
const result = fntToBMFontAndPixelData(buffer, "MyFont", "font.png");
fs.writeFileSync("font.fnt", result.BMFTextBuffer);
// result.pixelData contains raw palette indices

// 3. Creating from scratch
const newFont = War2Font.fromGlyphs(myChars, 1);
const binaryInfo = newFont.write();
```
