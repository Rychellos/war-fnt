"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_PALETTE_NAME: () => DEFAULT_PALETTE_NAME,
  FontChar: () => FontChar,
  PALETTES: () => PALETTES,
  War2Font: () => War2Font,
  encodeBMF: () => encodeBMF,
  fntToBMFontAndPixelData: () => fntToBMFontAndPixelData,
  getPalette: () => getPalette
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_PALETTE_NAME,
  FontChar,
  PALETTES,
  War2Font,
  encodeBMF,
  fntToBMFontAndPixelData,
  getPalette
});
