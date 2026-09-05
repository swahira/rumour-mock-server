const express = require('express');
const router = express.Router();

router.post('/reserve', (req, res) => {
    const { customer_id, product_sku } = req.body;
    res.status(200).json({
        reservation_id: "RES-" + Math.floor(Math.random() * 10000),
        price: 99.99
    });
});
module.exports = router;
