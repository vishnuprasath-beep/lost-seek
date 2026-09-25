const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Check if this is an API route
  if (urlPath.startsWith('/api/')) {
    const routeName = urlPath.replace('/api/', '').split('/')[0];
    const authRoutes = ['login', 'register', 'change-password', 'profile'];
    const targetFile = authRoutes.includes(routeName) ? 'auth.js' : `${routeName}.js`;
    const handlerPath = path.join(ROOT, 'api', targetFile);

    if (fs.existsSync(handlerPath)) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        req.body = body;
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
        try {
          const handler = require(handlerPath);
          handler(req, res);
        } catch (err) {
          console.error(`API Route Error (${urlPath}):`, err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'API Route Not Found' }));
      return;
    }
  }

  // Static file serving
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (urlPath === '/story') filePath = path.join(ROOT, 'story.html');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`LostSeek test server running on http://localhost:${PORT}`);
});
