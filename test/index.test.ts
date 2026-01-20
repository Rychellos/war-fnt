import { fntToBMFontAndPixelData } from "../src/index";
import * as fs from "node:fs";
import * as path from "node:path";
import { Jimp } from "jimp";
import { test, expect, beforeAll, afterAll } from "vitest";

const testFolder = "temp_tests_index";

beforeAll(() => {
    if (!fs.existsSync(testFolder)) {
        fs.mkdirSync(testFolder);
    }
});

afterAll(() => {
    if (fs.existsSync(testFolder)) {
        fs.rmSync(testFolder, { recursive: true, force: true });
    }
});

test("Decoding .fnt file", async () => {
    console.log("Starting Decoding .fnt file test...");
    const file = fs.readFileSync("test/small.war2-fnt");

    console.log("Parsing .fnt file...");
    let font:
        | {
            pixelData: Uint8Array<ArrayBuffer> | null;
            BMFTextBuffer: Uint8Array<ArrayBuffer>;
            size: {
                width: number;
                height: number;
            };
        }
        | undefined = fntToBMFontAndPixelData(file.buffer as ArrayBuffer, "small", "small", 0);

    expect(font, "Failed to parse file data").toBeDefined();

    const lookup = [
        { r: 0, g: 0, b: 0, a: 0 },
        { r: 0xf4, g: 0xe0, b: 0x20, a: 0xff }, // #f4e020
        { r: 208, g: 192, b: 28, a: 0xff }, // #d0c01c
        { r: 168, g: 140, b: 16, a: 0xff }, // #a88c10
        { r: 92, g: 48, b: 0, a: 0xff }, // #5c3000
        { r: 0, g: 0, b: 0, a: 0xff }, // #000000
    ];

    expect(font.pixelData).toBeDefined();

    console.log("Converting pixel data to RGBA...");
    const colorData = new Uint8Array(4 * font.pixelData!.length);

    for (let index = 0; index < font.pixelData!.length; index++) {
        const color = lookup[font.pixelData![index]];
        if (color) {
            colorData[index * 4] = color.r;
            colorData[index * 4 + 1] = color.g;
            colorData[index * 4 + 2] = color.b;
            colorData[index * 4 + 3] = color.a;
        }
    }

    console.log("Creating image with Jimp...");
    const png = new Jimp({
        data: Buffer.from(colorData),
        width: font.size.width,
        height: font.size.height,
    });

    expect(png, "Failed to create Jimp instance").toBeDefined();

    console.log("Saving test.png...");
    const pngBuffer = await png.getBuffer("image/png");
    fs.writeFileSync(path.join(testFolder, "test.png"), pngBuffer);

    expect(
        fs.existsSync(path.join(testFolder, "test.png")),
        "Failed to create .png"
    ).toBe(true);

    console.log("Saving test.fnt...");
    fs.writeFileSync(path.join(testFolder, "test.fnt"), font.BMFTextBuffer);

    expect(
        fs.existsSync(path.join(testFolder, "test.fnt")),
        "Failed to create .fnt"
    ).toBe(true);

    console.log("Decoding test successful.");
});
