const http = require('http');

http.createServer((req, res) => {

    // Allow requests from Live Server origin
    const allowedOrigin = req.headers.origin || '*';

    if (req.url === '/no-cors') {
        // ❌ No CORS header — browser will BLOCK this
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "This response has NO CORS header" }));

    } else if (req.url === '/with-cors') {
        // ✅ Allow ALL origins
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ message: "✅ CORS allowed! Data fetched successfully." }));

    } else if (req.url === '/specific-cors') {
        // ✅ Allow ONLY this specific origin
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://127.0.0.1:5500'
        });
        res.end(JSON.stringify({ message: "✅ Only allowed for specific origin!" }));

    } else {
        res.writeHead(404);
        res.end('Not found');
    }

}).listen(3000, () => {
    console.log('✅ CORS API Server running at http://localhost:3000');
    console.log('   /no-cors       → No CORS header (will be blocked)');
    console.log('   /with-cors     → CORS allowed for all origins');
    console.log('   /specific-cors → CORS allowed only for 127.0.0.1:5500');
});