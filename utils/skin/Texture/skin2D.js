const jimp = require('jimp');

class skin2D {
    constructor(buffer, slim = false) {
        this.buffer = buffer;
        this.slim = slim;
    }

    async getSkin() {
        return {
            head: await (await this.getHead()).getBase64Async(jimp.MIME_PNG),
            body: await (await this.getBody()).getBase64Async(jimp.MIME_PNG),
            original: await (await this.getOriginal()).getBase64Async(jimp.MIME_PNG)
        };
    }

    async getHead() {
        let head_inner_crop = (await jimp.read(this.buffer)).crop(8, 8, 8, 8);
        let head_outer_crop = (await jimp.read(this.buffer)).crop(40, 8, 8, 8);
        let head = head_inner_crop.composite(head_outer_crop, 0, 0);
        return head;
    }

    async getBody() {
        let calque = await jimp.create(16, 32);
        let head = await this.getHead();
        calque = calque.composite(head, 4, 0).clone();

        let body_inner_crop = (await jimp.read(this.buffer)).crop(20, 20, 8, 12);
        let body_outer_crop = (await jimp.read(this.buffer)).crop(20, 36, 8, 12);
        let body = body_inner_crop.composite(body_outer_crop, 0, 0);
        calque = calque.composite(body, 4, 8).clone();

        let armsRight_inner_crop = (await jimp.read(this.buffer)).crop(44, 20, 4, 12);
        let armsRight_outer_crop = (await jimp.read(this.buffer)).crop(44, 36, 4, 12);
        let arms = armsRight_inner_crop.composite(armsRight_outer_crop, 0, 0);
        calque = calque.composite(arms, 0, 8).clone();

        let armsLeft_inner_crop = (await jimp.read(this.buffer)).crop(36, 52, 4, 12);
        let armsLeft_outer_crop = (await jimp.read(this.buffer)).crop(52, 52, 4, 12);
        arms = armsLeft_inner_crop.composite(armsLeft_outer_crop, 0, 0);
        calque = calque.composite(arms, 12, 8).clone();

        let legsRight_inner_crop = (await jimp.read(this.buffer)).crop(4, 20, 4, 12);
        let legsRight_outer_crop = (await jimp.read(this.buffer)).crop(4, 36, 4, 12);
        let legs = legsRight_inner_crop.composite(legsRight_outer_crop, 0, 0);
        calque = calque.composite(legs, 4, 20).clone();

        let legsLeft_inner_crop = (await jimp.read(this.buffer)).crop(20, 52, 4, 12);
        let legsLeft_outer_crop = (await jimp.read(this.buffer)).crop(4, 52, 4, 12);
        legs = legsLeft_inner_crop.composite(legsLeft_outer_crop, 0, 0);
        calque = calque.composite(legs, 8, 20).clone();

        return calque;
    }

    async getOriginal() {
        return await jimp.read(this.buffer);
    }
}

module.exports = skin2D;