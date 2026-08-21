import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ARTIFACT_DIR = 'C:/Users/Tusha/.gemini/antigravity-ide/brain/f554b134-22ee-4602-9dd3-68faa8f301af';
const buildDir = 'D:/Businesses/Agency-BrandNest/Websites-V2/FutureTech-V2/futuretek-frontend/build';
const PORT = 3005;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(buildDir, reqPath === '/' ? 'index.html' : reqPath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            filePath = path.join(buildDir, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500);
                res.end('Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const executablePath = edgePaths.find(p => fs.existsSync(p));

async function main() {
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Internal server running on port ${PORT}`);

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log(`Navigating to http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const footerElement = await page.$('footer');
    if (footerElement) {
        console.log('Capturing footer element screenshot...');
        const savePath = path.join(ARTIFACT_DIR, 'frontend_footer_view.png');
        await footerElement.screenshot({ path: savePath });
        console.log('Saved screenshot: frontend_footer_view.png');
    }

    await browser.close();
    server.close();
    console.log('Done!');
}

main().catch(err => {
    console.error(err);
    server.close();
});
