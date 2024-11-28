// Basic server-side code using Node.js and Express to handle HTTP requests, Server-Side Events (SSE), and manage turtle states

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const os = require('os');
const { body, validationResult } = require('express-validator'); // Import express-validator


const app = express();
const port = 8008;
const hostname = os.hostname();

app.use(cors());
// Middleware to parse incoming request parameters
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data
app.use(express.json()); // To parse JSON data
// Configure multer for multipart form-data
const upload = multer();

// Store turtles based on client IP or session
let turtles = {};
let clients = [];

// Serve static assets (e.g., images for the client-side)
app.use('/assets', express.static('assets'));
app.use('/client', express.static('client'));


// Handle GET request to update or create a turtle
app.get('/api', (req, res) => {
    let clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // use a regex to get the substring that is the IP address
    clientIp = clientIp.match(/\d+\.\d+\.\d+\.\d+/)[0];

    // If no parameters are provided, display a help page
    if (Object.keys(req.query).length === 0) {
        showHelpMessage(res);
        return;
    }

    if (!turtles[clientIp]) {
        turtles[clientIp] = {
            name: clientIp,
            x: 0,
            y: 0,
            r: 255,
            g: 255,
            b: 255,
            w: 3,
            method: 'GET',
            commands: {}
        };
    }

    const turtle = turtles[clientIp];

    // Update turtle parameters from GET query
    if (req.query.x) turtle.x = parseInt(req.query.x);
    if (req.query.y) turtle.y = parseInt(req.query.y);

    res.json({
        message: 'Turtle updated via GET',
        turtle: turtle
    });

    // Notify all connected clients of the update
    clients.forEach(client => client.write(`data: ${JSON.stringify(turtle)}\n\n`));
});


// Handle POST request to update or create a turtle
app.post('/api', upload.none(),
    // Validation and sanitization with express-validator
    [
        body('name').escape(), // Sanitize the name to prevent XSS
        body('x').isInt().toInt().optional(), // Validate and sanitize x
        body('y').isInt().toInt().optional(), // Validate and sanitize y
        body('r').isInt({ min: 0, max: 255 }).toInt().optional(), // Validate color value
        body('g').isInt({ min: 0, max: 255 }).toInt().optional(), // Validate color value
        body('b').isInt({ min: 0, max: 255 }).toInt().optional(), // Validate color value
        body('w').isInt({ min: 1, max: 200 }).toInt().optional(), // Validate line width
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
        res.setHeader('Access-Control-Allow-Origin', '*');

        // If no parameters are provided, display a help page
        if (Object.keys(req.body).length === 0) {
            showHelpMessage(res);
            return;
        }

        if (!turtles[clientIp]) {
            turtles[clientIp] = {
                name: clientIp,
                x: 0,
                y: 0,
                r: 255,
                g: 255,
                b: 255,
                w: 3,
                method: 'POST',
                commands: {}
            };
        }

        const turtle = turtles[clientIp];

        // Update turtle parameters from POST body
        if (req.body.x) turtle.x = parseInt(req.body.x);
        if (req.body.y) turtle.y = parseInt(req.body.y);
        if (req.body.r) turtle.r = parseInt(req.body.r);
        if (req.body.g) turtle.g = parseInt(req.body.g);
        if (req.body.b) turtle.b = parseInt(req.body.b);
        if (req.body.w) turtle.w = parseInt(req.body.w);
        if (req.body.name) turtle.name = req.body.name;

        res.json({
            message: 'Turtle updated via POST',
            turtle: turtle
        });

        // Notify all connected clients of the update
        clients.forEach(client => client.write(`data: ${JSON.stringify(turtle)}\n\n`));
    });

// Handle opening links in a new tab
app.get('/open', (req, res) => {
    const url = req.query.url;
    if (url) {
        res.send(`
            <html>
                <body>
                    <script>
                        window.open('${url}', '_blank');
                        window.location.href = '/';
                    </script>
                </body>
            </html>
        `);
    } else {
        res.status(400).send('URL parameter is missing');
    }
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

// Make any other route display the help message
app.use((req, res) => {
    showHelpMessage(res);
});


// Handle invalid routes
function showHelpMessage(res) {
    res.send(`
        <h1>Turtle Graphics API</h1>
        <p>Use the following query parameters to control your turtle:</p>
        <ul>
        <li><b>x</b>: Set the x-coordinate of the turtle (GET or POST) (e.g., ?x=100)</li>
        <li><b>y</b>: Set the y-coordinate of the turtle (GET or POST) (e.g., ?y=200)</li>
        <li><b>r</b>: Set the red component of the line color (0-255) (POST only) (e.g., r=255)</li>
        <li><b>g</b>: Set the green component of the line color (0-255) (POST only) (e.g., g=100)</li>
        <li><b>b</b>: Set the blue component of the line color (0-255) (POST only) (e.g., b=50)</li>
        <li><b>w</b>: Set the line weight (POST only) (e.g., w=5)</li>
        <li><b>name</b>: Set the name of the turtle (POST only) (e.g., name=Speedy)</li>
        </ul>
        <p>Example: <code>http://turlte.nl/api/?x=400&y=300</code></p>
        <br>
        <p>For a real-time turtle graphics demo, visit the <a href="/client" target="_blank">Turtle Graphics Client</a>.</p>
        
        <iframe src="/client" width="100%" height="600px" style="border:none;"></iframe>
    `);
}


// Start the server
app.listen(port, () => {
    console.log(`Server is running at >http://${hostname}:${port}`);
});
