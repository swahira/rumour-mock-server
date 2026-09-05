const express = require('express');
const router = express.Router();

// Mock Data
const data = {
    user: { id: "u-101", name: "Jane Doe", posts: [{ id: "p-1", title: "Hello GQL" }] }
};

router.post('/', (req, res) => {
    const body = req.body || {};
    const query = body.query || '';

    if (!query) {
        return res.status(400).json({ error: "No query provided" });
    }
    
    // Simulate GQL Parsing (Mutation - Create User)
    if (query.toLowerCase().includes('createuser')) {
        const vars = body.variables || {};
        const name = vars.name || 'Jane Doe';
        return res.json({ data: { createUser: { id: "u-101", name: name } } });
    }

    // Simulate GQL Parsing (Query - Get User)
    if (query.toLowerCase().includes('user(') || query.toLowerCase().includes('getuser')) {
        return res.json({ data: { user: data.user } });
    }

    // Simulate GQL Parsing (Query - Generic User)
    if (query.toLowerCase().includes('user')) {
        return res.json({ data: { user: data.user } });
    }

    // Simulate GQL Parsing (Mutation - Create Post)
    if (query.toLowerCase().includes('createpost')) {
        const vars = body.variables || {};
        const title = vars.title || 'Untitled Post';
        const newPost = { id: `p-${Date.now()}`, title };
        return res.json({ data: { createPost: newPost } });
    }

    res.status(400).json({ errors: [{ message: "Unknown query" }] });
});

module.exports = router;
