// Assuming that the server-side logic is managed by a Node.js server, here is a port of the client-side code to p5.js with a similar structure:

let turtles = {};
let currentTurtle;
let assetManager;

function preload() {
    assetManager = new AssetManager();
    assetManager.loadAllImages();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    currentTurtle = new Turtle("default");

    // Set up Server-Side Events (SSE)
    const eventSource = new EventSource(`http://${location.hostname}/events`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data) {
            if (!turtles[data.clientIp]) {
                turtles[data.clientIp] = new Turtle(data.clientIp);
            }
            const turtle = turtles[data.clientIp];
            turtle.moveTo(createVector(data.x, data.y));
            turtle.lineColor = color(data.r, data.g, data.b);
            turtle.lineWeight = data.w;
            turtle.name = data.name;
        }
    };
}

function draw() {
    background(0);

    for (let key in turtles) {
        let turtle = turtles[key];
        turtle.update();
        turtle.draw();
    }
}

function mousePressed() {
    if (mouseButton === LEFT && currentTurtle) {
        currentTurtle.moveTo(createVector(mouseX, mouseY));
    } else if (mouseButton === RIGHT && currentTurtle) {
        currentTurtle.lineColor = color(random(255), random(255), random(255));
        currentTurtle.lineWeight = random(2, 20);
    }
}

function keyPressed() {
    if (key === ' ') {
        turtles = {};
    }
}
