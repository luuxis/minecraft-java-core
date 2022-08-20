/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const sharp = require('sharp');

module.exports = class skin2D {
    constructor(buffer, slim = false) {
        this.buffer = buffer;
        this.slim = slim;
    }

    async getSkin() {
        return {
            head: `data:image/png;base64,${await this.base64(await this.getHead())}`,
            body: `data:image/png;base64,${await this.base64(await this.getBody())}` ,
            original: `data:image/png;base64,${await this.base64(this.buffer)}`
        };
    }

    async getHead() {
        let firstLayer = await sharp(this.buffer)
            .extract({ left: 8, top: 8, width: 8, height: 8 }).toBuffer();

        let lastLayer = await sharp(this.buffer)
            .extract({ left: 40, top: 8, width: 8, height: 8 }).toBuffer();

        let head = sharp(firstLayer).composite([{ input: lastLayer }])

        return await head.png().toBuffer();
    }

    async getBody() {
        let calque = await sharp({
            create: {
                width: 16,
                height: 32,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).png().toBuffer();

        let head = await this.getHead()


        let body_inner = await sharp(this.buffer)
            .extract({ left: 20, top: 20, width: 8, height: 12 }).toBuffer();

        let body_outer = await sharp(this.buffer)
            .extract({ left: 20, top: 36, width: 8, height: 12 }).toBuffer();

        let armsRight_inner = await sharp(this.buffer)
            .extract({ left: 44, top: 20, width: 4, height: 12 }).toBuffer();

        let armsRight_outer = await sharp(this.buffer)
            .extract({ left: 44, top: 36, width: 4, height: 12 }).toBuffer();

        let armsLeft_inner = await sharp(this.buffer)
            .extract({ left: 36, top: 52, width: 4, height: 12 }).toBuffer();

        let armsLeft_outer = await sharp(this.buffer)
            .extract({ left: 52, top: 52, width: 4, height: 12 }).toBuffer();

        let legsRight_inner = await sharp(this.buffer)
            .extract({ left: 4, top: 20, width: 4, height: 12 }).toBuffer();

        let legsRight_outer = await sharp(this.buffer)
            .extract({ left: 4, top: 36, width: 4, height: 12 }).toBuffer();

        let legsLeft_inner = await sharp(this.buffer)
            .extract({ left: 20, top: 52, width: 4, height: 12 }).toBuffer();

        let legsLeft_outer = await sharp(this.buffer)
            .extract({ left: 4, top: 52, width: 4, height: 12 }).toBuffer();

        let body = sharp(calque).composite([
            { input: head, left: 4, top: 0 },
            { input: body_inner, left: 4, top: 8 },
            { input: body_outer, left: 4, top: 8 },
            { input: armsRight_inner, left: 0, top: 8 },
            { input: armsRight_outer, left: 0, top: 8 },
            { input: armsLeft_inner, left: 12, top: 8 },
            { input: armsLeft_outer, left: 12, top: 8 },
            { input: legsRight_inner, left: 4, top: 20 },
            { input: legsRight_outer, left: 4, top: 20 },
            { input: legsLeft_inner, left: 8, top: 20 },
            { input: legsLeft_outer, left: 8, top: 20 }
        ])


        return await body.png().toBuffer();
    }

    async base64(buffer) {
        if (buffer == undefined) return;
        return buffer.toString('base64');
    }
}