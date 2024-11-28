class Turtle {
    constructor(name) {
        this.spriteSheet = new SpriteSheet("turtle@X4N4.png");
        this.spriteSheet.pause();
        this.position = createVector(random(width), random(height));
        this.startPosition = this.position.copy();
        this.endPosition = this.position.copy();
        this.direction = createVector(0, 1);
        this.moving = false;
        this.t = 0;
        this.name = name || "blub";
        this.lines = [];
        this.lineColor = color(255);
        this.lineWeight = 3;
        this.angle = 0;
        this.showUI = false;
        this.showHelp = false;
        this.status = "";
    }

    parseCommands(commands) {
        if (commands.x) this.moveX(parseInt(commands.x));
        if (commands.y) this.moveY(parseInt(commands.y));
        if (commands.r) this.lineColor = color(parseInt(commands.r), green(this.lineColor), blue(this.lineColor));
        if (commands.g) this.lineColor = color(red(this.lineColor), parseInt(commands.g), blue(this.lineColor));
        if (commands.b) this.lineColor = color(red(this.lineColor), green(this.lineColor), parseInt(commands.b));
        if (commands.w) this.lineWeight = parseInt(commands.w);
        if (commands.name) this.name = commands.name;
        if (commands.c && commands.c === "true") this.lines = [];
        if (commands.h) this.showHelp = commands.h === "true";
        if (commands.u) this.showUI = commands.u === "true";
    }

    update() {
        if (this.moving) {
            this.position = p5.Vector.lerp(this.startPosition, this.endPosition, this.t);
            this.t += 0.02;
            this.direction = p5.Vector.sub(this.endPosition, this.startPosition).normalize();
            this.angle = atan2(this.direction.y, this.direction.x) + PI / 2;
        }

        if (this.t > 1.0) {
            this.t = 0;
            this.moving = false;
            this.lines.push(new LineSegment(this.startPosition, this.endPosition, this.lineColor, this.lineWeight));
            this.startPosition.set(this.endPosition);
            this.spriteSheet.pause();
        }
    }

    moveX(x) {
        this.endPosition.x = x;
        this.moveTo(this.endPosition);
    }

    moveY(y) {
        this.endPosition.y = y;
        this.moveTo(this.endPosition);
    }

    moveTo(endPosition) {

        this.endPosition.x = constrain(endPosition.x, 0, width);
        this.endPosition.y = constrain(endPosition.y, 0, height);

        if (this.moving) {
            this.lines.push(new LineSegment(this.startPosition, this.position, this.lineColor, this.lineWeight));
        }
        this.startPosition = this.position.copy();
        this.t = 0;
        this.endPosition = endPosition.copy();
        this.moving = true;
        this.spriteSheet.play();
    }

    draw() {
        this.lineWeight = constrain(this.lineWeight, 0, 20);
        for (let line of this.lines) {
            line.draw();
        }
        stroke(this.lineColor);
        strokeWeight(this.lineWeight);
        line(this.startPosition.x, this.startPosition.y, this.position.x, this.position.y);
        push();
        translate(this.position.x, this.position.y);
        rotate(this.angle);
        this.spriteSheet.update();
        this.spriteSheet.draw(-this.spriteSheet.frameWidth / 2, -this.spriteSheet.frameHeight / 2);
        textSize(20);
        text(this.status, -textWidth(this.status) / 2, -30);
        rotate(-this.angle);
        strokeWeight(1);
        noStroke();
        fill(255);
        textSize(12);
        text(this.name, -textWidth(this.name) / 2, 45);        
        pop();
    }
}
