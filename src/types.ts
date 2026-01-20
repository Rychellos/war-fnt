export type War2FontHeader = {
    lowIndex: number;
    highIndex: number;
    totalChars: number;
    maxHeight: number;
    maxWidth: number;
};

export interface BMFontInfo {
    fontSize: number; // int16
    smooth: boolean;
    unicode: boolean;
    italic: boolean;
    bold: boolean;
    fixedHeight?: boolean;
    charSet?: number; // uint8
    stretchH: number; // uint16
    aa: number; // uint8
    padding: [number, number, number, number]; // up, right, down, left (uint8)
    spacing: [number, number]; // horiz, vert (uint8)
    outline: number; // uint8
    fontName: string; // null-terminated
}

export interface BMFontCommon {
    lineHeight: number; // uint16
    base: number; // uint16
    scaleW: number; // uint16
    scaleH: number; // uint16
    pages: number; // uint16
    packed: boolean; // bit 7 in bitField
    alphaChnl: number; // uint8
    redChnl: number; // uint8
    greenChnl: number; // uint8
    blueChnl: number; // uint8
}

export interface BMFontChar {
    id: number; // uint32
    x: number; // uint16
    y: number; // uint16
    width: number; // uint16
    height: number; // uint16
    xoffset: number; // int16
    yoffset: number; // int16
    xadvance: number; // int16
    page: number; // uint8
    chnl: number; // uint8
}

export interface BMFontKerningPair {
    first: number; // uint32
    second: number; // uint32
    amount: number; // int16
}

export interface BMFontData {
    info: BMFontInfo;
    common: BMFontCommon;
    pages: string[]; // one per page, null terminated in block
    chars: BMFontChar[];
    kernings?: BMFontKerningPair[]; // optional, omitted if empty or undefined
}
