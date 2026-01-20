#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_yargs = __toESM(require("yargs"));
var import_helpers = require("yargs/helpers");

// src/commands/unpack.ts
var unpack_exports = {};
__export(unpack_exports, {
  builder: () => builder,
  command: () => command,
  describe: () => describe,
  handler: () => handler
});
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_jimp = require("jimp");

// src/BMFontTextWriter.ts
function encodeBMF(data) {
  let output = "";
  output += `info face=${data.info.fontName} `;
  output += `size=${data.info.fontSize} `;
  output += `bold=${data.info.bold ? 1 : 0} `;
  output += `italic=${data.info.italic ? 1 : 0} `;
  output += `charset="" `;
  output += `unicode=${data.info.unicode ? 1 : 0} `;
  output += `stretchH=${data.info.stretchH} `;
  output += `smooth=${data.info.smooth ? 1 : 0} `;
  output += `aa=1 `;
  output += `padding=${data.info.padding.join(",")} `;
  output += `spacing=${data.info.spacing.join(",")} `;
  output += `outline=${data.info.outline}
`;
  output += `common lineHeight=${data.common.lineHeight} `;
  output += `base=${data.common.base} `;
  output += `scaleW=${data.common.scaleW} `;
  output += `scaleH=${data.common.scaleH} `;
  output += `pages=${data.common.pages} `;
  output += `packed=${data.common.packed ? 1 : 0} `;
  output += `alphaChnl=${data.common.alphaChnl} `;
  output += `redChnl=${data.common.redChnl} `;
  output += `greenChnl=${data.common.greenChnl} `;
  output += `blueChnl=${data.common.blueChnl}
`;
  for (let i = 0; i < data.pages.length; i++) {
    output += `page id=${i} file="${data.pages[i]}"
`;
  }
  output += `chars count=${data.chars.length}
`;
  for (const char of data.chars) {
    output += `char id=${char.id} `;
    output += `x=${char.x} `;
    output += `y=${char.y} `;
    output += `width=${char.width} `;
    output += `height=${char.height} `;
    output += `xoffset=${char.xoffset} `;
    output += `yoffset=${char.yoffset} `;
    output += `xadvance=${char.xadvance} `;
    output += `page=${char.page} `;
    output += `chnl=${char.chnl}
`;
  }
  const kernings = data.kernings || [];
  if (kernings.length > 0) {
    output += `kernings count=${kernings.length}
`;
    for (const k of kernings) {
      output += `kerning first=${k.first} second=${k.second} amount=${k.amount}
`;
    }
  }
  const encoder = new TextEncoder();
  return encoder.encode(output);
}

// src/FontChar.ts
var FontChar = class {
  constructor(charCode, _width, _height, xOffset = 0, yOffset = 0, atlasX = 0, atlasY = 0) {
    this.charCode = charCode;
    this._width = _width;
    this._height = _height;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.atlasX = atlasX;
    this.atlasY = atlasY;
    this._data = new Uint8Array(_width * _height);
  }
  _data;
  adjustData(newWidth, newHeight) {
    const newData = new Uint8Array(newWidth * newHeight);
    for (let y = 0; y < Math.min(this.height, newHeight); y++) {
      for (let x = 0; x < Math.min(this.width, newWidth); x++) {
        newData[y * newWidth + x] = this._data[y * this.width + x];
      }
    }
    this.width = newWidth;
    this.height = newHeight;
    this._data = newData;
  }
  get width() {
    return this._width;
  }
  set width(value) {
    this.adjustData(value, this._height);
  }
  get height() {
    return this._height;
  }
  set height(value) {
    this.adjustData(this._width, value);
  }
  get data() {
    return this._data;
  }
};

// src/War2Font.ts
var War2Font = class _War2Font {
  constructor(charSpacing = 1) {
    this.charSpacing = charSpacing;
    this.view = new DataView(new ArrayBuffer(0));
    this.header = {
      highIndex: 0,
      lowIndex: 0,
      maxHeight: 0,
      maxWidth: 0,
      totalChars: 0
    };
  }
  static FONT_IDENTIFIER = 1414418246;
  // "FONT"
  static PALETTE_INDEX_LIMIT = 8;
  view;
  cursor = 0;
  chars = [];
  header;
  atlasSize = {
    width: 0,
    height: 0
  };
  pixelData = null;
  static fromBuffer(buffer, charSpacing = 1) {
    const font = new _War2Font(charSpacing);
    font.parseBuffer(buffer);
    return font;
  }
  /**
   * Creates a War2Font instance from a list of FontChar objects.
   */
  static fromGlyphs(chars, charSpacing = 1) {
    const font = new _War2Font(charSpacing);
    font.chars = chars;
    font.recalculateHeader();
    font.calculateAtlasSizeAndPlaceChars();
    font.pixelData = font.generateAtlasTexture();
    return font;
  }
  parseBuffer(buffer) {
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
  write() {
    this.recalculateHeader();
    const chunks = [];
    const headerBuffer = new ArrayBuffer(8);
    const headerView = new DataView(headerBuffer);
    headerView.setInt32(0, _War2Font.FONT_IDENTIFIER, true);
    headerView.setUint8(4, this.header.lowIndex);
    headerView.setUint8(5, this.header.highIndex);
    headerView.setUint8(6, this.header.maxWidth);
    headerView.setUint8(7, this.header.maxHeight);
    chunks.push(new Uint8Array(headerBuffer));
    const offsetsBuffer = new ArrayBuffer(this.header.totalChars * 4);
    const offsetsView = new DataView(offsetsBuffer);
    const charDataChunks = [];
    let currentOffset = 8 + this.header.totalChars * 4;
    for (let i = 0; i < this.header.totalChars; i++) {
      const charCode = this.header.lowIndex + i;
      const char = this.chars.find((c) => c.charCode === charCode);
      if (!char) {
        offsetsView.setUint32(i * 4, 0, true);
        continue;
      }
      offsetsView.setUint32(i * 4, currentOffset, true);
      const compressed = this.compressChar(char);
      charDataChunks.push(compressed);
      currentOffset += compressed.byteLength;
    }
    chunks.push(new Uint8Array(offsetsBuffer));
    chunks.push(...charDataChunks);
    const totalLength = chunks.reduce(
      (acc, chunk) => acc + chunk.byteLength,
      0
    );
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of chunks) {
      result.set(chunk, pos);
      pos += chunk.byteLength;
    }
    return result;
  }
  recalculateHeader() {
    if (this.chars.length === 0) return;
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
      maxHeight
    };
  }
  compressChar(char) {
    const header = new Uint8Array(4);
    header[0] = char.width;
    header[1] = char.height;
    new DataView(header.buffer).setInt8(2, char.xOffset);
    new DataView(header.buffer).setInt8(3, char.yOffset);
    const pixelData = [];
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
        pixelData.push(skipCount * _War2Font.PALETTE_INDEX_LIMIT + val);
        skipCount = 0;
      }
    }
    while (skipCount > 0) {
      const count = Math.min(skipCount, 32);
      pixelData.push((count - 1) * _War2Font.PALETTE_INDEX_LIMIT);
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
  getPixelData() {
    return this.pixelData;
  }
  getChars() {
    return this.chars;
  }
  getHeader() {
    return this.header;
  }
  getAtlasSize() {
    return this.atlasSize;
  }
  readHeader() {
    if (this.view.getInt32(0, true) !== _War2Font.FONT_IDENTIFIER) {
      throw new Error(
        `[War2Font] No valid file format.
Expected: ${_War2Font.FONT_IDENTIFIER}, but got: ${this.view.getInt32(
          0,
          true
        )}`
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
      maxWidth
    };
  }
  readOffsetsToCharData() {
    const offsets = [];
    for (let i = 0; i < this.header.totalChars; i++) {
      offsets.push(this.view.getUint32(this.cursor, true));
      this.cursor += 4;
    }
    return offsets;
  }
  getCharsDetails() {
    const offsets = this.readOffsetsToCharData();
    const chars = [];
    for (let index = 0; index < offsets.length; index++) {
      const offset = offsets[index];
      if (offset === 0) continue;
      const char = new FontChar(
        this.header.lowIndex + index,
        this.view.getUint8(offset),
        this.view.getUint8(offset + 1),
        this.view.getInt8(offset + 2),
        this.view.getInt8(offset + 3)
      );
      this.readPixelData(char, offset + 4);
      chars.push(char);
    }
    return chars;
  }
  readPixelData(char, readCursor) {
    let pixelIndex = 0;
    const totalPixels = char.width * char.height;
    while (pixelIndex < totalPixels) {
      let paletteColorIndex = this.view.getUint8(readCursor++);
      while (paletteColorIndex >= _War2Font.PALETTE_INDEX_LIMIT) {
        paletteColorIndex -= _War2Font.PALETTE_INDEX_LIMIT;
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
  addSpaceChar() {
    if (!this.chars.find((c) => c.charCode === 32)) {
      this.chars.push(new FontChar(32, this.header.maxWidth, 0));
    }
  }
  calculateApproxAtlasWidth() {
    let area = 0;
    for (let index = 0; index < this.chars.length; index++) {
      const char = this.chars[index];
      if (!char) {
        continue;
      }
      area += (char.width + this.charSpacing) * (char.height + this.charSpacing);
    }
    let atlasWidth = Math.ceil(Math.sqrt(area));
    return Math.pow(4, Math.ceil(Math.log(atlasWidth) / Math.log(4)));
  }
  calculateAtlasSizeAndPlaceChars() {
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
      height: atlasHeight
    };
  }
  generateAtlasTexture() {
    const pixelData = new Uint8Array(
      this.atlasSize.width * this.atlasSize.height
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
  drawCharPixels(char, targetData) {
    for (let y = 0; y < char.height; y++) {
      for (let x = 0; x < char.width; x++) {
        const val = char.data[y * char.width + x];
        targetData[(y + char.atlasY) * this.atlasSize.width + x + char.atlasX] = val;
      }
    }
  }
  static fromBMFont(bmFontDesc, imageData, palette) {
    const font = new _War2Font();
    const lines = bmFontDesc.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("char ")) {
        const charProps = trimmed.split(/\s+/).slice(1);
        const props = {};
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
        const char = new FontChar(id, width, height, xoffset, yoffset);
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
};

// src/palettes.ts
function hex(hex2) {
  hex2 = hex2.replace(/^#/, "");
  if (hex2.length === 6) {
    return {
      r: parseInt(hex2.substring(0, 2), 16),
      g: parseInt(hex2.substring(2, 4), 16),
      b: parseInt(hex2.substring(4, 6), 16),
      a: 255
    };
  } else if (hex2.length === 8) {
    return {
      r: parseInt(hex2.substring(0, 2), 16),
      g: parseInt(hex2.substring(2, 4), 16),
      b: parseInt(hex2.substring(4, 6), 16),
      a: parseInt(hex2.substring(6, 8), 16)
    };
  }
  return { r: 255, g: 0, b: 255, a: 255 };
}
var PALETTES = {
  grayscale: [
    { r: 0, g: 0, b: 0, a: 0 },
    { r: 255, g: 255, b: 255, a: 255 },
    { r: 200, g: 200, b: 200, a: 255 },
    { r: 150, g: 150, b: 150, a: 255 },
    { r: 100, g: 100, b: 100, a: 255 },
    { r: 50, g: 50, b: 50, a: 255 },
    { r: 25, g: 25, b: 25, a: 255 },
    { r: 0, g: 0, b: 0, a: 255 }
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
    "#ffffff",
    // Fixed short #fff to full #ffffff for parser
    "#ffffff"
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
  ].map(hex)
};
var DEFAULT_PALETTE_NAME = "DEFAULT";
function getPalette(name) {
  if (name && PALETTES[name]) {
    return PALETTES[name];
  }
  return PALETTES[DEFAULT_PALETTE_NAME];
}

// src/index.ts
function fntToBMFontAndPixelData(data, fontName, fileName, characterSpacing = 1) {
  const reader = War2Font.fromBuffer(data, characterSpacing);
  const BMFTextBuffer = encodeBMF({
    chars: reader.getChars().map((char) => ({
      x: char.atlasX,
      y: char.atlasY,
      width: char.width,
      height: char.height,
      id: char.charCode,
      xoffset: char.xOffset,
      yoffset: char.yOffset,
      xadvance: char.width + characterSpacing,
      page: 0,
      chnl: 15
    })),
    pages: [fileName],
    info: {
      aa: 0,
      bold: false,
      fontName,
      fontSize: reader.getHeader().maxHeight,
      italic: false,
      outline: 0,
      padding: [0, 0, 0, 0],
      smooth: false,
      spacing: [1, 1],
      stretchH: 100,
      //No scaling
      unicode: false
    },
    common: {
      alphaChnl: 0,
      redChnl: 0,
      greenChnl: 0,
      blueChnl: 0,
      scaleW: reader.getAtlasSize().width,
      scaleH: reader.getAtlasSize().height,
      pages: 1,
      packed: false,
      lineHeight: reader.getHeader().maxHeight,
      base: reader.getHeader().maxHeight
    }
  });
  return {
    pixelData: reader.getPixelData(),
    BMFTextBuffer,
    size: reader.getAtlasSize()
  };
}

// src/commands/unpack.ts
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
      const png = new import_jimp.Jimp({
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
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var import_jimp2 = require("jimp");
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
    const image = await import_jimp2.Jimp.read(imgPath);
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
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var import_jimp3 = require("jimp");
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
        const png = new import_jimp3.Jimp({
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
var fs4 = __toESM(require("fs"));
var path4 = __toESM(require("path"));
var import_jimp4 = require("jimp");
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
        const image = await import_jimp4.Jimp.read(imgPath);
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
var fs5 = __toESM(require("fs"));
var path5 = __toESM(require("path"));
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
var fs6 = __toESM(require("fs"));
var import_jimp5 = require("jimp");
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
    const canvas = new import_jimp5.Jimp({ width: totalWidth, height: maxHeight });
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
                (0, import_jimp5.rgbaToInt)(color.r, color.g, color.b, color.a),
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
(0, import_yargs.default)((0, import_helpers.hideBin)(process.argv)).command(unpack_exports).command(pack_exports).command(split_exports).command(stitch_exports).command(info_exports).command(render_exports).command(palettes_exports).demandCommand().help().parse();
