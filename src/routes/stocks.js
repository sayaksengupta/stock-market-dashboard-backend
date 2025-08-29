const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// GET /api/stocks/:symbol - Fetch real-time stock data
router.get('/:symbol', stockController.getStockQuote);

// GET /api/stocks/history/:symbol - Fetch historical stock data for charts
router.get('/history/:symbol', stockController.getStockHistory);

module.exports = router;