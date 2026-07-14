const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Helper to format responses like httpbin
const formatHttpBinResponse = (req) => {
    return {
        args: req.query || {},
        headers: req.headers || {},
        origin: req.ip || "127.0.0.1",
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        ...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? {
            data: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
            files: {}, // Mock empty files
            form: {}, // Mock empty form
            json: req.is('application/json') ? req.body : null
        } : {})
    };
};

/**
 * /get
 * Returns GET data.
 */
router.get('/get', (req, res) => {
    res.json(formatHttpBinResponse(req));
});

/**
 * /post
 * Returns POST data.
 */
router.post('/post', (req, res) => {
    res.json(formatHttpBinResponse(req));
});

/**
 * /anything
 * Returns request data, including method, for any HTTP method.
 */
router.all('/anything*', (req, res) => {
    res.json({
        ...formatHttpBinResponse(req),
        method: req.method
    });
});

/**
 * /headers
 * Returns the incoming request's HTTP headers.
 */
router.get('/headers', (req, res) => {
    res.json({ headers: req.headers });
});

/**
 * /response-headers
 * Returns a set of response headers from the query string.
 */
router.get('/response-headers', (req, res) => {
    // Copy query parameters to response headers
    for (const [key, value] of Object.entries(req.query)) {
        res.setHeader(key, value);
    }
    
    res.json({
        "Content-Type": "application/json",
        ...req.query
    });
});

/**
 * /json
 * Returns a sample JSON object (matches assertion in assertion_test.toml)
 */
router.get('/json', (req, res) => {
    res.json({
        slideshow: {
            author: "Yours Truly",
            date: "date of publication",
            slides: [
                {
                    type: "all",
                    title: "Wake up to WonderWidgets!"
                },
                {
                    type: "all",
                    title: "Overview of WonderWidgets"
                }
            ],
            title: "Sample Slide Show"
        }
    });
});

/**
 * /status/:code
 * Returns given HTTP Status code.
 */
router.all('/status/:code', (req, res) => {
    const code = parseInt(req.params.code, 10);
    if (!isNaN(code) && code >= 100 && code <= 599) {
        res.status(code).send();
    } else {
        res.status(400).send("Invalid status code");
    }
});

/**
 * /bearer
 * Prompts the user for authorization using bearer authentication.
 */
router.get('/bearer', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        res.json({
            authenticated: true,
            token: token
        });
    } else {
        res.status(401).send();
    }
});

/**
 * /uuid
 * Returns a UUID.
 */
router.get('/uuid', (req, res) => {
    res.json({
        uuid: crypto.randomUUID()
    });
});

/**
 * /image/png
 * Returns a simple 1x1 transparent PNG.
 */
router.get('/image/png', (req, res) => {
    const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': imgBuffer.length
    });
    res.end(imgBuffer);
});

/**
 * /products
 * Mock for the products endpoint used in documentation examples.
 * Mimics /get behavior.
 */
router.get('/products', (req, res) => {
    res.json(formatHttpBinResponse(req));
});

module.exports = router;
