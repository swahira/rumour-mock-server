const express = require('express');
const router = express.Router();

let users = [
    { id: 1, username: 'dev_lead', role: 'lead', team: 'alpha' },
    { id: 2, username: 'intern_1', role: 'intern', team: 'alpha' },
    { id: 3, username: 'manager_x', role: 'manager', team: 'beta' }
];

// 1. Search & Filtering (Query Param Stress)
router.get('/', (req, res) => {
    const { role, team, search } = req.query;
    let filtered = users;
    if (role) filtered = filtered.filter(u => u.role === role);
    if (team) filtered = filtered.filter(u => u.team === team);
    if (search) filtered = filtered.filter(u => u.username.includes(search));
    res.json(filtered);
});

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const SECRET = 'rumour-super-secret';
const USERS_FILE = path.resolve(__dirname, '../../data/users.json');

router.get('/profile', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token required' });
    }
    
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        const registeredUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
        
        // Find user by email from token
        const user = registeredUsers.find(u => u.email === decoded.email);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: `Profile for user ${decoded.email} does not exist. It must be created via registration.` 
            });
        }
        
        res.json({ id: user.id, username: user.name || user.username, email: user.email, role: user.role });
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
});

router.post('/profile', (req, res) => {
    const { username, email } = req.body;
    if (email === null) return res.status(400).json({ error: 'Email cannot be null' });
    res.json({ ok: true, username });
});

// 2. Hierarchical CRUD
router.post('/', (req, res) => {
    const { username, role } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const newUser = { id: users.length + 1, username, role: role || 'user' };
    users.push(newUser);
    res.status(201).json(newUser);
});

// 3. Negative: Conflict (Duplicate Username)
router.post('/register', (req, res) => {
    const { username } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'User already exists', code: 'USER_CONFLICT' });
    }
    res.json({ success: true });
});

const loadRegisteredUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

const saveRegisteredUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(`[USERS] Error saving users:`, e.message);
    }
};

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const registeredUsers = loadRegisteredUsers();
    const user = registeredUsers.find(u => u.id == id) || users.find(u => u.id == id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const { also_delete_parent } = req.body || {};

    // 1. Delete from persistent store
    let registeredUsers = loadRegisteredUsers();
    const regIndex = registeredUsers.findIndex(u => u.id == id);
    if (regIndex !== -1) {
        registeredUsers.splice(regIndex, 1);
        saveRegisteredUsers(registeredUsers);
    }

    // 2. Delete from in-memory (fallback/legacy)
    const index = users.findIndex(u => u.id == id);
    if (index !== -1) users.splice(index, 1);

    if (also_delete_parent) {
        const pIndex = registeredUsers.findIndex(u => u.id == also_delete_parent);
        if (pIndex !== -1) {
            registeredUsers.splice(pIndex, 1);
            saveRegisteredUsers(registeredUsers);
        }
    }

    res.status(204).end();
});

module.exports = router;
