const express = require('express');
const multer = require('multer');
const cors = require('cors');
const os = require('os');
const { body, validationResult } = require('express-validator');
const app = express();
const port = 8008;
const hostname = os.hostname();
const upload = multer();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static('assets'));
app.use('/client', express.static('client'));

let turtles = {};
let clients = [];

// Middleware to get client IP
function getClientIp(req, res, next) {
  req.clientIp = req.headers['x-forwarded-for'] 
    ? req.headers['x-forwarded-for'].split(',')[0].trim() 
    : req.socket.remoteAddress;
  next();
}

// Middleware to initialize turtle if not already present
function initializeTurtle(req, res, next) {
  if (!turtles[req.clientIp]) {
    turtles[req.clientIp] = {
      name: req.clientIp,
      x: 0,
      y: 0,
      r: 255,
      g: 255,
      b: 255,
      w: 3,
      clientIp: req.clientIp,
      timestamp: Math.floor(Date.now() / 1000),
      method: req.method,
      commands: {}
    };
  }
  req.turtle = turtles[req.clientIp];
  next();
}

// Validation and sanitization middleware
const turtleValidation = [
  body('name').escape().optional(),
  body('x').isInt().toInt().optional(),
  body('y').isInt().toInt().optional(),
  body('r').isInt({ min: 0, max: 255 }).toInt().optional(),
  body('g').isInt({ min: 0, max: 255 }).toInt().optional(),
  body('b').isInt({ min: 0, max: 255 }).toInt().optional(),
  body('w').isInt({ min: 1, max: 200 }).toInt().optional(),
];

// Function to update turtle parameters
function updateTurtleParams(turtle, params) {
  if (params.x !== undefined) turtle.x = params.x;
  if (params.y !== undefined) turtle.y = params.y;
  if (params.r !== undefined) turtle.r = params.r;
  if (params.g !== undefined) turtle.g = params.g;
  if (params.b !== undefined) turtle.b = params.b;
  if (params.w !== undefined) turtle.w = params.w;
  if (params.name) turtle.name = params.name;

  turtle.timestamp = Math.floor(Date.now() / 1000); // Update timestamp
}

// Route to display help message
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

// Route to handle GET request to update or create a turtle
app.get('/api', getClientIp, initializeTurtle, (req, res) => {
  if (Object.keys(req.query).length === 0) {
    showHelpMessage(res);
    return;
  }

  updateTurtleParams(req.turtle, req.query);
  res.json({
    message: 'Turtle updated via GET',
    turtle: req.turtle
  });

  clients.forEach(client => client.write(`data: ${JSON.stringify(req.turtle)}\n\n`));
});

// Route to handle POST request to update or create a turtle
app.post('/api', getClientIp, upload.none(), turtleValidation, initializeTurtle, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (Object.keys(req.body).length === 0) {
    showHelpMessage(res);
    return;
  }

  updateTurtleParams(req.turtle, req.body);
  res.json({
    message: 'Turtle updated via POST',
    turtle: req.turtle
  });

  clients.forEach(client => client.write(`data: ${JSON.stringify(req.turtle)}\n\n`));
});

// Route to get all turtles, filtered by timestamp
app.get('/turtles', (req, res) => {
  const timestamp = req.query.timestamp ? parseInt(req.query.timestamp) : Math.floor(Date.now() / 1000) - 3600;
  const filteredTurtles = Object.values(turtles).filter(turtle => turtle.timestamp >= timestamp);
  res.json(filteredTurtles);
});

// Handle SSE connection
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Handle other routes with help message
app.use((req, res) => {
  showHelpMessage(res);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://${hostname}:${port}`);
});
