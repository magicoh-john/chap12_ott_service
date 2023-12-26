
const http = require('http');  // Importing the http module

const hostname = '127.0.0.1';  // Localhost
const port = 3000;  // Port 3000

// Creating the HTTP server
const server = http.createServer((req, res) => {
  res.statusCode = 200;  // Setting the status code to 200 (OK)
  res.setHeader('Content-Type', 'text/plain');  // Setting the content type to text/plain
  res.end('Hello Everyone');  // Ending the response with "Hello Everyone"
});

// Server listens on specified hostname and port
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
