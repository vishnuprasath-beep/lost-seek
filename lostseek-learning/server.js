// ==========================================================================
// LostSeek Learning — Phase 3A: Minimal Node.js HTTP Server
// Built exclusively using Node.js standard built-in modules (no Express).
// ==========================================================================

const http = require('http');

// Port to listen on
const PORT = 3000;

// 1. In-Memory Storage
// This array holds reports in the server's RAM memory while the server is running.
// Note: If you stop or restart the server, this array resets back to empty.
const reports = [];

// Counter to generate simple numeric IDs: 1, 2, 3...
let nextId = 1;

// 2. Create the HTTP Server
// Every time a browser or client makes a request to http://localhost:3000,
// this callback function runs with two objects:
// - req: the IncomingMessage object (contains method, url, headers, and body stream)
// - res: the ServerResponse object (used to send back status, headers, and data)
const server = http.createServer((req, res) => {
  // Extract URL and HTTP method
  const url = req.url;
  const method = req.method;

  // 3. CORS Headers
  // Why CORS exists:
  // Browsers block web pages from fetching data from a different port or domain
  // unless the server explicitly grants permission.
  // These headers allow our learning frontend to communicate with this backend.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight OPTIONS request sent by browsers before POST/DELETE
  if (method === 'OPTIONS') {
    res.writeHead(204); // 204 No Content
    res.end();
    return;
  }

  // 4. Route: GET /api/reports
  // Returns all reports currently stored in the server's array as JSON.
  if (method === 'GET' && url === '/api/reports') {
    // Tell the client we are returning JSON data with HTTP status 200 (OK)
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Convert the JavaScript array into a JSON text string and send it
    const responsePayload = JSON.stringify({ reports: reports });
    res.end(responsePayload);
    return;
  }

  // 5. Route: POST /api/reports
  // Receives a new report from the client and adds it to the reports[] array.
  if (method === 'POST' && url === '/api/reports') {
    let bodyData = '';

    // HTTP request bodies arrive in small binary data chunks (streams).
    // We listen for the 'data' event to piece those chunks together.
    req.on('data', (chunk) => {
      bodyData += chunk.toString();
    });

    // The 'end' event fires when the entire body has finished arriving.
    req.on('end', () => {
      try {
        // Parse the incoming JSON text into a JavaScript object
        const data = JSON.parse(bodyData);

        // Validation: Ensure mandatory fields exist
        if (!data.type || !data.itemName || !data.category || !data.location) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Missing required fields. Must include type, itemName, category, and location.'
          }));
          return;
        }

        // Create the new report object with a unique numeric ID
        const newReport = {
          id: nextId++,
          type: String(data.type).toUpperCase(), // 'LOST' or 'FOUND'
          itemName: String(data.itemName).trim(),
          description: data.description ? String(data.description).trim() : '',
          category: String(data.category).trim(),
          color: data.color ? String(data.color).trim() : '',
          location: String(data.location).trim()
        };

        // Add to our server array
        reports.push(newReport);

        // Send back HTTP 201 (Created) and the newly created report object
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newReport));
      } catch (error) {
        // Malformed JSON (syntax error in the request body)
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON format in request body.' }));
      }
    });
    return;
  }

  // 6. Route: DELETE /api/reports
  // Clears all reports from the server's in-memory array.
  if (method === 'DELETE' && url === '/api/reports') {
    // Reset array length to 0 to empty it
    reports.length = 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'All reports deleted' }));
    return;
  }

  // 7. Fallback: 404 Not Found
  // Runs if the client requested an unknown URL or unsupported method.
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

// 8. Start the Server Listening on Port 3000
server.listen(PORT, () => {
  console.log(`LostSeek Learning server running at http://localhost:${PORT}`);
  console.log(`API endpoint available at: http://localhost:${PORT}/api/reports`);
});
