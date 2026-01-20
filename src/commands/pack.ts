import * as fs from "node:fs";
import * as path from "node:path";
import { Argv, Arguments } from "yargs";
import { Jimp } from "jimp";
import { War2Font } from "../index";

export const command = "pack <fnt> <image>";
export const describe = "Convert BMFont and PNG back to Blizzard .fnt format";

export const builder = (y: Argv) => {
    return y
        .positional("fnt", {
            describe: "Path to the BMFont .fnt file",
            type: "string",
            demandOption: true,
        })
        .positional("image", {
            describe: "Path to the PNG atlas image",
            type: "string",
            demandOption: true,
        })
        .option("palette", {
            alias: "p",
            describe: "Path to JSON palette file (array of {r,g,b,a})",
            type: "string",
            demandOption: true,
        })
        .option("output", {
            alias: "o",
            describe: "Output file path",
            type: "string",
        });
};

export const handler = async (argv: Arguments<{ fnt: string; image: string; palette: string; output?: string }>) => {
    const fntPath = argv.fnt;
    const imgPath = argv.image;
    const palPath = argv.palette;
    const outputPath = argv.output || path.join(path.dirname(fntPath), `${path.basename(fntPath, ".fnt")}.war2.fnt`);

    if (!fs.existsSync(fntPath) || !fs.existsSync(imgPath) || !fs.existsSync(palPath)) {
        console.error("One or more input files not found.");
        process.exit(1);
    }

    console.log(`Packing ${fntPath} and ${imgPath}...`);

    try {
        const bmfDesc = fs.readFileSync(fntPath, "utf-8");
        const image = await Jimp.read(imgPath);
        const palette = JSON.parse(fs.readFileSync(palPath, "utf-8"));

        const font = War2Font.fromBMFont(
            bmfDesc,
            {
                width: image.bitmap.width,
                height: image.bitmap.height,
                data: new Uint8Array(image.bitmap.data),
            },
            palette
        );

        const binary = font.write();
        fs.writeFileSync(outputPath, binary);
        console.log(`Created: ${outputPath}`);
    } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
    }
};
