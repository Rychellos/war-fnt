# Blizzard's .fnt file format used in Warcraft 2

Format of a .fnt file is composed of 3 sections which are placed one after the another:

1. [Header](#header)
2. [Char Pointers](#char-pointers)
3. [Font Data](#font-data)

#### Symbols used:

-   BYTE
-   LONG = 4 BYTES

## Sections:

### 1. Header

Holds basic information about the font

```ts
type Header = {
    // Identifier - always is "FONT"
    name: LONG;
    // Charcode of first character in font
    lowIndex: BYTE;
    // Charcode of last character in font
    highIndex: BYTE;
    // Maximum width of a single char in font
    maxWidth: BYTE;
    // Maximum height of a single char in font
    maxHeight: BYTE;
};
```

## 2. Char Pointers

There are `Header.highIndex - Header.lowIndex + 1` LONG's. Each LONG is offset in the file to a single character. Can be 0 if there's no pixel data, e.g. space character.

## 3. Font Data

```ts
type Character = {
    // Width of the letter
    width: BYTE;
    // Height of the letter
    height: BYTE;
    // X Offset for the topleft corner of the letter.
    xOffset: BYTE;
    // Y Offset for the topleft corner of the letter.
    yOffset: BYTE;
    // Encoded pixel data
    data: BYTE[];
};
```

Each entry in data array is encoded. We read it until we have enought pixels for complete image (width \* height).

Each pixel has 8 possible values (0-7) which are used to determine color of a pixel.

In order to determine how many transparent pixels are encoded in a byte of data, we can divide it by 8. The resulting whole number is amount of 0-index (transparent) pixels and the remainder is the index of a color.

#### Example decoding function looks like this:

```ts
function decodeByte(value: BYTE): number[] {
    const pixelData: number[] = [];

    while (value >= 8) {
        pixelData.push(0); // Index 0 is transparecy
        value = value - 8;
    }

    pixelData.push(value);

    return pixelData;
}
```

#### Algorithm rundown:

| Step | value | pixelData       | comment                          |
| ---- | ----- | --------------- | -------------------------------- |
| 0.   | 39    | []              | <- before entering while loop    |
| 1.   | 31    | [0]             | <- after first iteration in loop |
| 2.   | 23    | [0, 0]          |                                  |
| 3.   | 15    | [0, 0, 0]       |                                  |
| 4.   | 7     | [0, 0, 0, 0]    | <- outside while loop            |
| 5.   | 7     | [0, 0, 0, 0, 7] | <- after pixelData.push(value)   |
