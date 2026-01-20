#!/usr/bin/env node
import {
  FontChar,
  PALETTES,
  War2Font,
  __export,
  fntToBMFontAndPixelData,
  getPalette
} from "./chunk-FVNSB5KC.mjs";

// src/cli.ts
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// src/commands/unpack.ts
var unpack_exports = {};
__export(unpack_exports, {
  builder: () => builder,
  command: () => command,
  describe: () => describe,
  handler: () => handler
});
import * as fs from "fs";
import * as path from "path";
import { Jimp } from "jimp";
var command = "unpack <file>";
var describe = "Convert a Blizzard .fnt file to BMFont and PNG atlas";
var builder = (y) => {
  return y.positional("file", {
    describe: "Path to the .fnt file",
    type: "string",
    demandOption: true
  }).option("output", {
    alias: "o",
    describe: "Output directory",
    type: "string",
    default: "."
  }).option("name", {
    alias: "n",
    describe: "Font name to use in .fnt file",
    type: "string"
  }).option("spacing", {
    alias: "s",
    describe: "Character spacing in atlas",
    type: "number",
    default: 1
  }).option("palette", {
    alias: "p",
    describe: "Path to JSON palette file",
    type: "string"
  });
};
var handler = async (argv) => {
  const filePath = argv.file;
  const outputDir = argv.output;
  const fontName = argv.name || path.basename(filePath, ".fnt");
  const spacing = argv.spacing;
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Unpacking ${filePath}...`);
  try {
    const buffer = fs.readFileSync(filePath);
    const result = fntToBMFontAndPixelData(
      buffer.buffer,
      fontName,
      `${fontName}.png`,
      spacing
    );
    const fntPath = path.join(outputDir, `${fontName}.fnt`);
    fs.writeFileSync(fntPath, result.BMFTextBuffer);
    console.log(`Created: ${fntPath}`);
    if (result.pixelData) {
      const lookup = getPalette(argv.palette);
      const colorData = new Uint8Array(4 * result.pixelData.length);
      for (let i = 0; i < result.pixelData.length; i++) {
        const idx = result.pixelData[i];
        const color = lookup[idx] || lookup[0];
        colorData[i * 4] = color.r;
        colorData[i * 4 + 1] = color.g;
        colorData[i * 4 + 2] = color.b;
        colorData[i * 4 + 3] = color.a;
      }
      const png = new Jimp({
        data: Buffer.from(colorData),
        width: result.size.width,
        height: result.size.height
      });
      const pngBuffer = await png.getBuffer("image/png");
      const pngPath = path.join(outputDir, `${fontName}.png`);
      fs.writeFileSync(pngPath, pngBuffer);
      console.log(`Created: ${pngPath}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/pack.ts
var pack_exports = {};
__export(pack_exports, {
  builder: () => builder2,
  command: () => command2,
  describe: () => describe2,
  handler: () => handler2
});
import * as fs2 from "fs";
import * as path2 from "path";
import { Jimp as Jimp2 } from "jimp";
var command2 = "pack <fnt> <image>";
var describe2 = "Convert BMFont and PNG back to Blizzard .fnt format";
var builder2 = (y) => {
  return y.positional("fnt", {
    describe: "Path to the BMFont .fnt file",
    type: "string",
    demandOption: true
  }).positional("image", {
    describe: "Path to the PNG atlas image",
    type: "string",
    demandOption: true
  }).option("palette", {
    alias: "p",
    describe: "Path to JSON palette file (array of {r,g,b,a})",
    type: "string",
    demandOption: true
  }).option("output", {
    alias: "o",
    describe: "Output file path",
    type: "string"
  });
};
var handler2 = async (argv) => {
  const fntPath = argv.fnt;
  const imgPath = argv.image;
  const palPath = argv.palette;
  const outputPath = argv.output || path2.join(path2.dirname(fntPath), `${path2.basename(fntPath, ".fnt")}.war2.fnt`);
  if (!fs2.existsSync(fntPath) || !fs2.existsSync(imgPath) || !fs2.existsSync(palPath)) {
    console.error("One or more input files not found.");
    process.exit(1);
  }
  console.log(`Packing ${fntPath} and ${imgPath}...`);
  try {
    const bmfDesc = fs2.readFileSync(fntPath, "utf-8");
    const image = await Jimp2.read(imgPath);
    const palette = JSON.parse(fs2.readFileSync(palPath, "utf-8"));
    const font = War2Font.fromBMFont(
      bmfDesc,
      {
        width: image.bitmap.width,
        height: image.bitmap.height,
        data: new Uint8Array(image.bitmap.data)
      },
      palette
    );
    const binary = font.write();
    fs2.writeFileSync(outputPath, binary);
    console.log(`Created: ${outputPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/split.ts
var split_exports = {};
__export(split_exports, {
  builder: () => builder3,
  command: () => command3,
  describe: () => describe3,
  handler: () => handler3
});
import * as fs3 from "fs";
import * as path3 from "path";
import { Jimp as Jimp3 } from "jimp";
var command3 = "split <file>";
var describe3 = "Extract each character into a separate PNG file";
var builder3 = (y) => {
  return y.positional("file", {
    describe: "Path to the .fnt file",
    type: "string",
    demandOption: true
  }).option("output", {
    alias: "o",
    describe: "Output directory",
    type: "string",
    demandOption: true
  }).option("palette", {
    alias: "p",
    describe: "Path to JSON palette file",
    type: "string"
  });
};
var handler3 = async (argv) => {
  const filePath = argv.file;
  const outputDir = argv.output;
  if (!fs3.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  if (!fs3.existsSync(outputDir)) {
    fs3.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Splitting ${filePath} into ${outputDir}...`);
  try {
    const buffer = fs3.readFileSync(filePath);
    const font = War2Font.fromBuffer(buffer.buffer);
    const chars = font.getChars();
    const metadata = {
      charSpacing: 1,
      // Default or could be an option
      glyphs: []
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
        const png = new Jimp3({
          data: Buffer.from(colorData),
          width: char.width,
          height: char.height
        });
        const pngBuffer = await png.getBuffer("image/png");
        fs3.writeFileSync(path3.join(outputDir, `char_${char.charCode}.png`), pngBuffer);
      }
    }
    fs3.writeFileSync(path3.join(outputDir, "metadata.json"), JSON.stringify(metadata, null, 2));
    console.log(`Split complete. Metadata and ${chars.length} glyphs saved.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/stitch.ts
var stitch_exports = {};
__export(stitch_exports, {
  builder: () => builder4,
  command: () => command4,
  describe: () => describe4,
  handler: () => handler4
});
import * as fs4 from "fs";
import * as path4 from "path";
import { Jimp as Jimp4 } from "jimp";
var command4 = "stitch <dir>";
var describe4 = "Combine individual PNG glyphs and metadata.json into a Blizzard .fnt file";
var builder4 = (y) => {
  return y.positional("dir", {
    describe: "Directory containing glyphs and metadata.json",
    type: "string",
    demandOption: true
  }).option("palette", {
    alias: "p",
    describe: "Path to JSON palette file",
    type: "string",
    demandOption: true
  }).option("output", {
    alias: "o",
    describe: "Output file path",
    type: "string",
    demandOption: true
  });
};
var handler4 = async (argv) => {
  const dir = argv.dir;
  const palPath = argv.palette;
  const outputPath = argv.output;
  const metaPath = path4.join(dir, "metadata.json");
  if (!fs4.existsSync(metaPath)) {
    console.error(`Metadata not found in ${dir}`);
    process.exit(1);
  }
  console.log(`Stitching glyphs from ${dir}...`);
  try {
    const metadata = JSON.parse(fs4.readFileSync(metaPath, "utf-8"));
    const palette = JSON.parse(fs4.readFileSync(palPath, "utf-8"));
    const fontChars = [];
    for (const glyph of metadata.glyphs) {
      const imgPath = path4.join(dir, `char_${glyph.id}.png`);
      const char = new FontChar(glyph.id, glyph.width, glyph.height, glyph.xOffset, glyph.yOffset);
      if (fs4.existsSync(imgPath)) {
        const image = await Jimp4.read(imgPath);
        const data = image.bitmap.data;
        for (let py = 0; py < glyph.height; py++) {
          for (let px = 0; px < glyph.width; px++) {
            const idx = (py * glyph.width + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let pid = 0; pid < palette.length; pid++) {
              const p = palette[pid];
              const dist = Math.sqrt(
                Math.pow(r - p.r, 2) + Math.pow(g - p.g, 2) + Math.pow(b - p.b, 2) + Math.pow(a - p.a, 2)
              );
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = pid;
              }
            }
            char.data[py * glyph.width + px] = bestIdx;
          }
        }
      }
      fontChars.push(char);
    }
    const font = War2Font.fromGlyphs(fontChars, metadata.charSpacing || 1);
    const binary = font.write();
    fs4.writeFileSync(outputPath, binary);
    console.log(`Created: ${outputPath}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/info.ts
var info_exports = {};
__export(info_exports, {
  builder: () => builder5,
  command: () => command5,
  describe: () => describe5,
  handler: () => handler5
});
import * as fs5 from "fs";
import * as path5 from "path";
var command5 = "info <file>";
var describe5 = "Show information about a Blizzard .fnt file";
var builder5 = (y) => {
  return y.positional("file", {
    describe: "Path to the .fnt file",
    type: "string",
    demandOption: true
  });
};
var handler5 = async (argv) => {
  const filePath = argv.file;
  if (!fs5.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  try {
    const buffer = fs5.readFileSync(filePath);
    const font = War2Font.fromBuffer(buffer.buffer);
    const header = font.getHeader();
    const chars = font.getChars();
    console.log(`
Font Info: ${path5.basename(filePath)}`);
    console.log(`-----------------------------------`);
    console.log(`Max Height:     ${header.maxHeight}px`);
    console.log(`Glyph Count:    ${chars.length}`);
    if (chars.length > 0) {
      const codes = chars.map((c) => c.charCode).sort((a, b) => a - b);
      console.log(`Code Range:     ${codes[0]} - ${codes[codes.length - 1]}`);
    }
    console.log(`-----------------------------------
`);
  } catch (err) {
    console.error(`Error reading font: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/render.ts
var render_exports = {};
__export(render_exports, {
  builder: () => builder6,
  command: () => command6,
  describe: () => describe6,
  handler: () => handler6
});
import * as fs6 from "fs";
import { Jimp as Jimp5, rgbaToInt } from "jimp";
var command6 = "render <file> <text>";
var describe6 = "Render a string of text using a Blizzard .fnt file";
var builder6 = (y) => {
  return y.positional("file", {
    describe: "Path to the .fnt file",
    type: "string",
    demandOption: true
  }).positional("text", {
    describe: `Text to render. Can be a string or JSON array: '[{"text": "Hi", "palette": "red"}]'`,
    type: "string",
    demandOption: true
  }).option("output", {
    alias: "o",
    describe: "Output PNG file path",
    type: "string",
    default: "render.png"
  }).option("palette", {
    alias: "p",
    describe: "Default palette name or path to JSON",
    type: "string"
  }).option("spacing", {
    alias: "s",
    describe: "Extra character spacing",
    type: "number",
    default: 1
  });
};
var handler6 = async (argv) => {
  const filePath = argv.file;
  if (!fs6.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  try {
    const buffer = fs6.readFileSync(filePath);
    const font = War2Font.fromBuffer(buffer.buffer, argv.spacing);
    const fontChars = font.getChars();
    const charMap = new Map(fontChars.map((c) => [c.charCode, c]));
    let segments = [];
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
    const loadPalette = (nameOrPath) => {
      if (!nameOrPath) return getPalette();
      if (PALETTES[nameOrPath]) return PALETTES[nameOrPath];
      if (fs6.existsSync(nameOrPath)) {
        return JSON.parse(fs6.readFileSync(nameOrPath, "utf-8"));
      }
      return getPalette();
    };
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
    const canvas = new Jimp5({ width: totalWidth, height: maxHeight });
    let cursorX = 0;
    for (const segment of segments) {
      const lookup = loadPalette(segment.palette || argv.palette);
      for (const char of segment.text) {
        const code = char.charCodeAt(0);
        const glyph = charMap.get(code) || charMap.get(32);
        if (!glyph) continue;
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
    fs6.writeFileSync(argv.output, outBuffer);
    console.log(`Rendered to: ${argv.output}`);
  } catch (err) {
    console.error(`Error rendering: ${err.message}`);
    process.exit(1);
  }
};

// src/commands/palettes.ts
var palettes_exports = {};
__export(palettes_exports, {
  builder: () => builder7,
  command: () => command7,
  describe: () => describe7,
  handler: () => handler7
});
var command7 = "palettes";
var describe7 = "List all available built-in palettes";
var builder7 = (y) => {
  return y;
};
var handler7 = async () => {
  console.log("Available Palettes:");
  console.log("-------------------");
  for (const name of Object.keys(PALETTES)) {
    console.log(`- ${name}`);
  }
  console.log("-------------------");
  console.log("You can use these names with the --palette option.");
};

// src/cli.ts
yargs(hideBin(process.argv)).command(unpack_exports).command(pack_exports).command(split_exports).command(stitch_exports).command(info_exports).command(render_exports).command(palettes_exports).demandCommand().help().parse();
