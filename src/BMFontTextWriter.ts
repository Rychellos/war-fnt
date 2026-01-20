import type { BMFontData } from "./types";

/**
 * BMFontTextWriter
 *
 * Function used to encode string version of AngelCode's BMFont format
 * https://angelcode.com/products/bmfont/
 */
export function encodeBMF(data: BMFontData): Uint8Array<ArrayBuffer> {
    let output = "";

    // 1. info
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
    output += `outline=${data.info.outline}\n`;

    // 2. common
    output += `common lineHeight=${data.common.lineHeight} `;
    output += `base=${data.common.base} `;
    output += `scaleW=${data.common.scaleW} `;
    output += `scaleH=${data.common.scaleH} `;
    output += `pages=${data.common.pages} `;
    output += `packed=${data.common.packed ? 1 : 0} `;
    output += `alphaChnl=${data.common.alphaChnl} `;
    output += `redChnl=${data.common.redChnl} `;
    output += `greenChnl=${data.common.greenChnl} `;
    output += `blueChnl=${data.common.blueChnl}\n`;

    // 3. pages
    for (let i = 0; i < data.pages.length; i++) {
        output += `page id=${i} file="${data.pages[i]}"\n`;
    }

    // 4. chars
    output += `chars count=${data.chars.length}\n`;

    // char id=32   x=0     y=0     width=0     height=0     xoffset=0     yoffset=0     xadvance=16    page=0  chnl=15
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
        output += `chnl=${char.chnl}\n`;
    }

    // 5. kernings
    const kernings = data.kernings || [];
    if (kernings.length > 0) {
        output += `kernings count=${kernings.length}\n`;
        for (const k of kernings) {
            output += `kerning first=${k.first} second=${k.second} amount=${k.amount}\n`;
        }
    }

    const encoder = new TextEncoder();

    return encoder.encode(output);
}
