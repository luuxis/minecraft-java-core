/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

function CustomBuffer(existingBuffer: any = Buffer.alloc(48)) {
    let buffer = existingBuffer;
    let offset = 0;

    this.writeletInt = (val: any) => {
        while (true) {
            if ((val & 0xFFFFFF80) == 0) {
                return this.writeUByte(val);
            }
            this.writeUByte(val & 0x7F | 0x80);
            val = val >>> 7;
        }
    };

    this.writeString = (string: any) => {
        this.writeletInt(string.length);
        if (offset + string.length >= buffer.length) Buffer.concat([buffer, new Buffer(string.length)]);
        buffer.write(string, offset, string.length, "UTF-8");
        offset += string.length;
    };

    this.writeUShort = (val: any) => {
        this.writeUByte(val >> 8);
        this.writeUByte(val & 0xFF);
    };

    this.writeUByte = (val: any) => {
        if (offset >= buffer.length) {
            buffer = Buffer.concat([buffer, new Buffer(50)]);
        }

        buffer.writeUInt8(val, offset++);
    };

    this.readletInt = function () {
        let val = 0;
        let count = 0;

        while (true) {
            let i = buffer.readUInt8(offset++);
            val |= (i & 0x7F) << count++ * 7;
            if ((i & 0x80) != 128) break
        }
        return val;
    };

    this.readString = () => {
        let length = this.readletInt();
        let str = buffer.toString("UTF-8", offset, offset + length);
        offset += length;
        return str;
    };

    this.buffer = () => {
        return buffer.slice(0, offset);
    };

    this.offset = () => {
        return offset;
    };
}

export default CustomBuffer