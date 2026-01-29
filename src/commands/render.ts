import * as fs from "node:fs";
import { Argv, Arguments } from "yargs";
import { Jimp, rgbaToInt } from "jimp";
import { War2Font, getPalette, PALETTES } from "../index";

export const command = "render <file> <text>";
export const describe = "Render a string of text using a Blizzard .fnt file";

export const builder = (y: Argv) => {
    return y
        .positional("file", {
            describe: "Path to the Blizzard .fnt file",
            type: "string",
            demandOption: true,
        })
        .positional("text", {
            describe: 'Text to render. Can be a string or JSON array: \'[{"text": "Hello ", "palette": "red"}, {"text": "World", "palette": "red"}]\'',
            type: "string",
            demandOption: true,
        })
        .option("output", {
            alias: "o",
            describe: "Output PNG file path",
            type: "string",
            default: "out.png",
        })
        .option("palette", {
            alias: "p",
            describe: "Name of built-in palette or path to JSON file (array of {r,g,b,a})",
            type: "string",
        })
        .option("spacing", {
            alias: "s",
            describe: "Extra character spacing",
            type: "number",
            default: 1,
        });
};

export const handler = async (argv: Arguments<{ file: string; text: string; output: string; palette?: string; spacing: number }>) => {
    const filePath = argv.file;
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    try {
        const buffer = fs.readFileSync(filePath);
        const font = War2Font.fromBuffer(buffer.buffer as ArrayBuffer, argv.spacing);
        const fontChars = font.getChars();
        const charMap = new Map(fontChars.map(c => [c.charCode, c]));

        let segments: { text: string; palette?: string }[] = [];
        const trimmedText = argv.text.trim();

        if (trimmedText.startsWith("[") || trimmedText.startsWith("{")) {
            try {
                const parsed = JSON.parse(argv.text);

                segments = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                segments = [{ text: argv.text, palette: argv.palette }];
            }
        } else {
            segments = [{ text: argv.text, palette: argv.palette }];
        }

        // Calculate dimensions
        let totalWidth = 0;
        let maxHeight = font.getHeader().maxHeight;

        for (const segment of segments) {
            for (const char of segment.text) {
                const code = char.charCodeAt(0);

                const glyph = charMap.get(code) || charMap.get(32);
                if (glyph) {
                    totalWidth += glyph.width + argv.spacing;
                }
            }
        }

        if (totalWidth === 0) {
            console.error("Nothing to render (empty text or missing glyphs).");
            process.exit(1);
        }

        const canvas = new Jimp({ width: totalWidth, height: maxHeight });
        let cursorX = 0;

        for (const segment of segments) {
            const lookup = getPalette(segment.palette || argv.palette);

            for (const char of segment.text) {
                const code = char.charCodeAt(0);
                const glyph = charMap.get(code) || charMap.get(32);

                if (!glyph) continue;

                // Draw glyph pixel-by-pixel
                for (let py = 0; py < glyph.height; py++) {
                    for (let px = 0; px < glyph.width; px++) {
                        const palIdx = glyph.data[py * glyph.width + px];

                        if (palIdx === 0) continue;

                        const color = lookup[palIdx] || lookup[0];
                        const drawX = cursorX + px;
                        const drawY = glyph.yOffset + py;

                        if (drawX >= 0 && drawX < canvas.bitmap.width && drawY >= 0 && drawY < canvas.bitmap.height) {
                            canvas.setPixelColor(
                                rgbaToInt(color.r, color.g, color.b, color.a),
                                drawX,
                                drawY
                            );
                        }
                    }
                }

                cursorX += glyph.width + argv.spacing;
            }
        }

        const outBuffer = await canvas.getBuffer("image/png");
        fs.writeFileSync(argv.output, outBuffer);
        console.log(`Rendered to: ${argv.output}`);
    } catch (err) {
        console.error(`Error rendering: ${(err as Error).message}`);
        process.exit(1);
    }
};
