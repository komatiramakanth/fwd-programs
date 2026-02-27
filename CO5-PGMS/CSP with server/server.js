const http = require('http');
const fs = require('fs');
const path = require('path');

function getFile(filename) {
    return fs.readFileSync(path.join(__dirname, filename), 'utf8');
}

http.createServer((req, res) => {

    if (req.url === '/' || req.url === '/attacker.html') {
        // ── Attacker page — no special headers needed ──
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getFile('attacker.html'));

    } else if (req.url === '/victim.html') {
        /*
          ❌ UNPROTECTED victim — no security headers set
          This page CAN be embedded inside any iframe
          CORS is open, XSS is possible
        */
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getFile('victim.html'));

    } else if (req.url === '/victim-protected.html') {
        /*
          ✅ PROTECTED victim — full security headers set

          X-Frame-Options: DENY
            → Old browsers: blocks this page from being embedded in any iframe
            → Same job as CSP frame-ancestors but for older browsers

          Content-Security-Policy: frame-ancestors 'none'
            → Modern browsers: blocks iframe embedding
            → More powerful than X-Frame-Options
            → Can also specify allowed origins like frame-ancestors 'self'

          X-XSS-Protection: 1; mode=block
            → Old browser built-in XSS filter
            → If XSS attack detected, browser blocks the page from rendering
            → Note: Modern browsers removed this — CSP script-src handles it now

          X-Content-Type-Options: nosniff
            → Prevents browser from guessing/sniffing the content type
            → Example: stops browser treating a .txt file as executable JavaScript

          Referrer-Policy: no-referrer
            → When user clicks a link, browser normally sends where they came from
            → no-referrer hides this — attacker can't see your page URL

          Strict-Transport-Security: max-age=31536000
            → Forces browser to use HTTPS only for next 1 year
            → Prevents downgrade attacks (HTTPS → HTTP)
        */
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'X-Frame-Options': 'DENY',
            'Content-Security-Policy': "frame-ancestors 'none'",
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
            'Strict-Transport-Security': 'max-age=31536000'
        });
        res.end(getFile('victim-protected.html'));

    } else {
        res.writeHead(404);
        res.end('Not found');
    }

}).listen(3000, () => {
    console.log('✅ CSP Demo Server running at http://localhost:3000');
    console.log('   /attacker.html          → Clickjacking attack page');
    console.log('   /victim.html            → Unprotected bank page');
    console.log('   /victim-protected.html  → Protected with CSP headers');
});