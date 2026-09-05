const express = require('express');
const router = express.Router();

router.post('/charge', (req, res) => {
    const { customer_id, reservation_id, amount } = req.body;
    res.status(200).json({
        payment_status: "SUCCESS",
        transaction_id: "TXN-" + Math.floor(Math.random() * 10000)
    });
});
module.exports = router;
