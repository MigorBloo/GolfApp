const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api/golfers',
        createProxyMiddleware({
            target: 'http://localhost:8001',
            changeOrigin: true,
        })
    );

    app.use(
        '/api/schedule',
        createProxyMiddleware({
            target: 'http://localhost:8001',
            changeOrigin: true,
            timeout: 60000, // Add timeout of 60 seconds
            proxyTimeout: 60000, // Add proxy timeout
            onError: (err, req, res) => {
                console.error('Proxy Error:', err);
                res.status(500).json({ error: 'Proxy error', details: err.message });
            }
        })
    );
};