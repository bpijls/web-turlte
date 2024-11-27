class SpriteSheet {
    constructor(imageName) {
        this.sourceImage = assetManager.get(imageName);
        this.parseFileName(imageName);
        this.fps = 8;
        this.updateInterval = 30 / this.fps;
        this.frame = 0;
        this.framesDrawn = 0;
        this.onPause = true;
        this.ended = false;
        this.loopAnim = true;
    }

    parseFileName(fileName) {
        let pattern = /@X(\d+)N(\d+)/;
        let match = fileName.match(pattern);
        if (match) {
            this.nx = parseInt(match[1]);
            this.nFrames = parseInt(match[2]);
            this.ny = Math.ceil(this.nFrames / this.nx);
            this.frameWidth = this.sourceImage.width / this.nx;
            this.frameHeight = this.sourceImage.height / this.ny;
        } else {
            throw new Error("Invalid filename format. Expected format: 'name@XnNn.png'");
        }
    }

    pause() {
        this.onPause = true;
    }

    play() {
        this.onPause = false;
    }

    update() {
        if (!this.onPause && !this.ended) {
            if (frameCount % this.updateInterval === 0) {
                this.frame = (this.frame + 1) % this.nFrames;
            }

            this.framesDrawn++;
            if (this.framesDrawn > this.nFrames && !this.loopAnim) {
                this.ended = true;
            }
        }
    }

    draw(x, y) {
        let frameX = (this.frame % this.nx) * this.frameWidth;
        let frameY = Math.floor(this.frame / this.nx) * this.frameHeight;
        image(this.sourceImage, x, y, this.frameWidth, this.frameHeight, frameX, frameY, this.frameWidth, this.frameHeight);
    }
}