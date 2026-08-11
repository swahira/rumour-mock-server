const express = require('express');
const router = express.Router();

// Mock Data
const data = {
    user: { id: "u-101", name: "GQL Master", posts: [{ id: "p-1", title: "Hello GQL" }] }
};

router.post('/', (req, res) => {
    const body = req.body || {};
    const query = body.query || '';

    if (!query) {
        return res.status(400).json({ error: "No query provided" });
    }

    // Simulate GQL Parsing (Query)
    if (query.includes('user')) {
        return res.json({ data: { user: data.user } });
    }

    // Simulate GQL Parsing (Mutation)
    if (query.includes('createPost')) {
        const vars = body.variables || {};
        const title = vars.title
            || (query.match(/title:\s*"([^"]+)"/) || [])[1]
            || 'Untitled Post';
        const newPost = { id: `p-${Date.now()}`, title };
        return res.json({ data: { createPost: newPost } });
    }

    res.status(400).json({ errors: [{ message: "Unknown query" }] });
});

module.exports = router;
