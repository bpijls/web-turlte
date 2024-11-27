// Basic server-side code using Node.js and Express to handle HTTP requests, Server-Side Events (SSE), and manage turtle states

const express = require('express');

const app = express();
const port = 8008;

// Store turtles based on client IP or session
let turtles = {};
let clients = [];


// Middleware to parse incoming request parameters
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets (e.g., images for the client-side)
app.use('/assets', express.static('assets'));
app.use('/client', express.static('client'));

// Handle GET request to update or create a turtle
app.get('/api', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


    // If no parameters are provided, display a help page
    if (Object.keys(req.query).length === 0) {
        res.send(`
      <h1>Turtle Graphics API</h1>
      <p>Use the following query parameters to control your turtle:</p>
      <ul>
        <li><b>x</b>: Set the x-coordinate of the turtle (e.g., ?x=100)</li>
        <li><b>y</b>: Set the y-coordinate of the turtle (e.g., ?y=200)</li>
        <li><b>r</b>: Set the red component of the line color (0-255) (e.g., ?r=255)</li>
        <li><b>g</b>: Set the green component of the line color (0-255) (e.g., ?g=100)</li>
        <li><b>b</b>: Set the blue component of the line color (0-255) (e.g., ?b=50)</li>
        <li><b>w</b>: Set the line weight (e.g., ?w=5)</li>
        <li><b>name</b>: Set the name of the turtle (e.g., ?name=Speedy)</li>
      </ul>
      <p>Example: <code>http://turlte.nl/api/?x=100&y=200&r=255&g=0&b=0&w=3&name=Speedy</code></p>
    `);
        return;
    }

    if (!turtles[clientIp]) {
        turtles[clientIp] = {
            name: clientIp,
            clientIp: clientIp,
            x: 0,
            y: 0,
            r: 255,
            g: 255,
            b: 255,
            w: 3,
            commands: {}
        };
    }

    const turtle = turtles[clientIp];

    // Update turtle parameters from query
    if (req.query.x) turtle.x = parseInt(req.query.x);
    if (req.query.y) turtle.y = parseInt(req.query.y);
    if (req.query.r) turtle.r = parseInt(req.query.r);
    if (req.query.g) turtle.g = parseInt(req.query.g);
    if (req.query.b) turtle.b = parseInt(req.query.b);
    if (req.query.w) turtle.w = parseInt(req.query.w);
    if (req.query.name) turtle.name = req.query.name;
    if (req.query.c) turtles = {}; // Clear all turtles

    res.json({
        message: 'Turtle updated',
        turtle: turtle
    });

    // Notify all connected clients of the update
    clients.forEach(client => client.write(`data: ${JSON.stringify(turtle)}\n\n`));
});

// Handle SSE connection
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Push this client to the clients array
    clients.push(res);

    // Remove client when connection closes
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Note: This server code is very basic and is meant to serve as a starting point. You may want to add more error handling, session management, or security features depending on your needs.
