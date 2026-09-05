const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    // Artificial delay to test SLA, sometimes 10ms, sometimes 100ms
    const delay = Math.random() < 0.1 ? 100 : 10;
    setTimeout(() => {
        res.status(201).json({ status: "PROCESSED", transaction_id: "TX-" + Math.floor(Math.random() * 10000) });
    }, delay);
});
module.exports = router;
