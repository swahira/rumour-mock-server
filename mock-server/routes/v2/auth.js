const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const SECRET = 'rumour-super-secret';
const ADMIN_SECRET = 'rumour-admin-secret';

const USERS_FILE = path.resolve(__dirname, '../../data/users.json');

// Helper to load users
const getUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        console.error(`[AUTH] Error loading users from ${USERS_FILE}:`, e.message);
        return [];
    }
};

// 1. JWT Flow
const loadUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`[AUTH] Error loading users from ${USERS_FILE}:`, e.message);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`[AUTH] Saved ${users.length} users to ${USERS_FILE}`);
    } catch (e) {
        console.error(`[AUTH] Error saving users to ${USERS_FILE}:`, e.message);
    }
};

router.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Validation Error", message: "Email and password are required" });
    }

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ error: "Conflict", message: "User already exists" });
    }

    const newUser = {
        id: users.length + 1,
        email,
        password, // In mock we keep it simple
        name: name || "New User",
        role: req.body.role || "user"
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ message: "User registered successfully", user: { email: newUser.email, id: newUser.id } });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    console.log(`[AUTH] Login attempt for: ${email}. Total users: ${users.length}`);

    // Find user by email or name (for flexibility)
    const user = users.find(u => u.email === email || u.name === email || u.username === email);

    if (!user) {
        console.log(`[AUTH] User not found: ${email}`);
        return res.status(401).json({
            error: 'User not found',
            message: `No account exists for "${email}"`
        });
    }

    if (user.password !== password) {
        return res.status(401).json({
            error: 'Invalid credentials',
            message: 'The password you entered is incorrect'
        });
    }

    const role = user.role || 'user';
    const token = jwt.sign(
        { email: user.email, role: role, id: user.id },
        role === 'admin' ? ADMIN_SECRET : SECRET,
        { expiresIn: '1h' }
    );

    res.json({
        token,
        role: role,
        user_id: user.id,
        expires_in: 3600
    });
});

// 2. Token Validation
router.get('/validate', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = auth.split(' ')[1];
    try {
        // Try verifying with either secret
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET);
        } catch (e) {
            decoded = jwt.verify(token, ADMIN_SECRET);
        }
        res.json({ valid: true, message: 'Token is active', user: decoded });
    } catch (e) {
        res.status(401).json({ error: 'Token verification failed', detail: e.message });
    }
});

// 3. Admin Only Route
router.get('/admin-only', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, ADMIN_SECRET);
        res.json({ message: 'Welcome Admin', data: decoded });
    } catch (e) {
        res.status(403).json({ error: 'Forbidden: Admin access required', detail: e.message });
    }
});

// 4. Token Expiry Simulation
router.get('/expired-token', (req, res) => {
    res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
});

// 5. Refresh Workflows
router.post('/refresh', (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });
    res.json({ token: jwt.sign({ email: 'user@example.com' }, SECRET), new_refresh: 'new-ref-123' });
});

// 6. Smart Mutation Showcase (Validation Healing)
router.post('/profile', (req, res) => {
    // If payload contains explicit nulls, throw validation error
    if (req.body.age === null || req.body.bio === null || req.body.website === null) {
        return res.status(400).json({ error: 'Validation Error', message: 'Null fields are not permitted in profile payload' });
    }
    res.json({ message: 'Profile updated successfully', data: req.body });
});

// 7. State Promotion Showcase (Workflow Healing)
let accountStates = {}; // Map of email -> state
router.get('/premium-features', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });
    try {
        const decoded = jwt.verify(token, SECRET);
        const email = decoded.email;
        if (accountStates[email] !== 'approved') {
            return res.status(403).json({ error: 'State Conflict', message: `Account for ${email} is pending. It must be approved before accessing premium features.` });
        }
        res.json({ message: `Welcome ${email} to premium features!` });
    } catch (e) {
        // Try admin secret
        try {
            const decoded = jwt.verify(token, ADMIN_SECRET);
            res.json({ message: "Admin access granted to premium features" });
        } catch (e2) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
});
router.post('/premium-features', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Auth required' });
    try {
        const decoded = jwt.verify(token, SECRET);
        accountStates[decoded.email] = 'approved';
        res.json({ message: 'Account approved successfully', new_state: 'approved' });
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// 8. Resource Reconstruction Showcase (Hard Healing)
let apiKeys = {}; // In-memory resource store
router.get('/api-keys/:id', (req, res) => {
    const key = apiKeys[req.params.id];
    if (!key) {
        return res.status(404).json({ error: 'Not Found', message: `API Key with ID ${req.params.id} does not exist.` });
    }
    res.json({ id: req.params.id, secret: key });
});
router.post('/api-keys', (req, res) => {
    // Generate a new random resource
    const newId = 'ak_' + Math.random().toString(36).substr(2, 6);
    apiKeys[newId] = 'sk_' + Math.random().toString(36).substr(2, 10);
    res.status(201).json({ id: newId, message: 'API Key created' });
});

module.exports = router;
