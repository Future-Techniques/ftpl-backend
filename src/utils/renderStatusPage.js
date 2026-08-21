export function getStatusHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Future Techniques API</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><circle cx='12' cy='12' r='10'/></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background-color: #0b0f19;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #f8fafc;
        }
        .card {
            background-color: #131c2e;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 52px 44px;
            max-width: 620px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
        }
        h1 {
            font-size: 34px;
            font-weight: 800;
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        p {
            color: #94a3b8;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            font-weight: 400;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 9px 20px;
            background-color: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 9999px;
            color: #34d399;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: .4; transform: scale(1.2); }
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Future Techniques API</h1>
        <p>The backend core is running smoothly and is ready to accept connections.</p>
        <div class="status-badge">
            <span class="status-dot"></span>
            <span>System Online</span>
        </div>
    </div>
</body>
</html>`;
}

export function handleStatusResponse(req, res) {
    if (req.accepts('html') && !req.xhr) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(getStatusHtml());
    }
    return res.json({
        result: 'success',
        service: 'Future Techniques API',
        status: 'online',
        message: 'The backend core is running smoothly and is ready to accept connections.',
        timestamp: new Date().toISOString()
    });
}
