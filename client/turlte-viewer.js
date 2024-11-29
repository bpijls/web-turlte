// Assuming that the server-side logic is managed by a Node.js server, here is a port of the client-side code to p5.js with a similar structure:
let turtles = {};
let currentTurtle;
let assetManager;
let statusIcons = {"GET": "", "POST": "👑"};

function preload() {
    assetManager = new AssetManager();
    assetManager.loadAllImages();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    currentTurtle = new Turtle("default");

    // fetch the existig turtles
    fetch(`http://${location.hostname}:${location.port}/turtles`)
        .then(response => response.json())
        .then(data => {
            for (let key in data) {
                let turtle = data[key];   
                console.log(turtle);             
                turtles[turtle.clientIp] = new Turtle(turtle.clientIp);
                turtles[turtle.clientIp].moveTo(createVector(turtle.x, turtle.y));
                turtles[turtle.clientIp].lineColor = color(turtle.r, turtle.g, turtle.b);
                turtles[turtle.clientIp].lineWeight = turtle.w;
                turtles[turtle.clientIp].name = turtle.name;
                turtles[turtle.clientIp].status = statusIcons[turtle.method];
                
            }
            
        });

    // Set up Server-Side Events (SSE)
    const eventSource = new EventSource(`http://${location.hostname}:${location.port}/events`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        console.log(turtles);
        if (data) {
            if (!turtles[data.clientIp]) {
                turtles[data.clientIp] = new Turtle(data.clientIp);
            }
            const turtle = turtles[data.clientIp];
            turtle.moveTo(createVector(data.x, data.y));
            turtle.lineColor = color(data.r, data.g, data.b);
            turtle.lineWeight = data.w;
            turtle.name = data.name;
            turtle.status = statusIcons[data.method];
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