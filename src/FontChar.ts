/**
 * Utility class used to manage each individual char
 */
export class FontChar {
    private _data: Uint8Array;

    constructor(
        public readonly charCode: number,
        private _width: number,
        private _height: number,
        public xOffset: number = 0,
        public yOffset: number = 0,
        public atlasX: number = 0,
        public atlasY: number = 0,
    ) {
        this._data = new Uint8Array(_width * _height);
    }

    private adjustData(newWidth: number, newHeight: number) {
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
    set width(value: number) {
        this.adjustData(value, this._height);
    }

    get height() {
        return this._height;
    }
    set height(value: number) {
        this.adjustData(this._width, value);
    }

    get data() {
        return this._data;
    }
}
