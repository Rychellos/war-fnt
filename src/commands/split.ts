import * as fs from "node:fs";
import * as path from "node:path";
import { Argv, Arguments } from "yargs";
import { Jimp } from "jimp";
import { War2Font, getPalette } from "../index";

export const command = "split <file>";
export const describe = "Extract each character into a separate PNG file";

export const builder = (y: Argv) => {
    return y
        .positional("file", {
            describe: "Path to the Blizzard .fnt file",
            type: "string",
            demandOption: true,
        })
        .option("output", {
            alias: "o",
            describe: "Output directory",
            type: "string",
            demandOption: true,
        })
        .option("palette", {
            alias: "p",
            describe: "Name of built-in palette or path to JSON file (array of {r,g,b,a})",
            type: "string",
        });
};

export const handler = async (argv: Arguments<{ file: string; output: string; palette?: string }>) => {
    const filePath = argv.file;
    const outputDir = argv.output;

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Splitting ${filePath} into ${outputDir}...`);

    try {
        const buffer = fs.readFileSync(filePath);
        const font = War2Font.fromBuffer(buffer.buffer as ArrayBuffer);
        const chars = font.getChars();

        const metadata = {
            charSpacing: 1, // Default or could be an option
            glyphs: [] as any[]
        };

        const lookup = getPalette(argv.palette);

        for (const char of chars) {
            metadata.glyphs.push({
                id: char.charCode,
                xOffset: char.xOffset,
                yOffset: char.yOffset,
                width: char.width,
                height: char.height
            });

            if (char.width > 0 && char.height > 0) {
                const colorData = new Uint8Array(4 * char.data.length);

                for (let i = 0; i < char.data.length; i++) {
                    const idx = char.data[i];
                    const color = lookup[char.data[i]] || lookup[0];
                    
                    colorData[i * 4] = color.r;
                    colorData[i * 4 + 1] = color.g;
                    colorData[i * 4 + 2] = color.b;
                    colorData[i * 4 + 3] = color.a;
                }

                const png = new Jimp({
                    data: Buffer.from(colorData),
                    width: char.width,
                    height: char.height
                });

                const pngBuffer = await png.getBuffer("image/png");
                fs.writeFileSync(path.join(outputDir, `char_${char.charCode}.png`), pngBuffer);
            }
        }

        fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2));
        console.log(`Split complete. Metadata and ${chars.length} glyphs saved.`);
    } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
    }
};
