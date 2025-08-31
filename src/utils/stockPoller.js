const axios = require('axios');

// Reuse controller helpers for consistency
const { calculateChange } = require('../controllers/stockController');

const FMP_BASE_URL = process.env.FMP_BASE_URL;
const API_KEY = process.env.FMP_API_KEY;
const POLL_INTERVAL = 5000; // 5 seconds

let subscribedSymbols = new Set(); // Track unique symbols
let pollIntervalId = null;

// Start polling for symbols
const startPolling = (newSymbols, io) => {
  newSymbols.forEach(symbol => subscribedSymbols.add(symbol.toUpperCase()));

  if (!pollIntervalId) {
    pollIntervalId = setInterval(async () => {
      for (const symbol of subscribedSymbols) {
        try {
          const data = await fetchStockData(symbol);
          console.log(data)
          io.emit('stockUpdate', data); // Emit to all clients
        } catch (error) {
          console.error(`Error polling ${symbol}:`, error.message);
        }
      }
    }, POLL_INTERVAL);
  }
};

// Stop polling for symbols
const stopPolling = (symbolsToRemove) => {
  symbolsToRemove.forEach(symbol => subscribedSymbols.delete(symbol.toUpperCase()));

  if (subscribedSymbols.size === 0 && pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
};

async function fetchStockData(symbol) {
  const response = await axios.get(`${FMP_BASE_URL}/quote/${symbol}`, {
    params: {
      apikey: API_KEY,
    },
  });


  const quoteData = response.data[0];
  if (!quoteData || !quoteData.price) {
    throw new Error('Invalid data');
  }

  const currentPrice = parseFloat(quoteData.price);
  const previousClose = parseFloat(quoteData.previousClose || quoteData.price); // Fallback if no previousClose
  const { change, percentChange } = calculateChange(currentPrice, previousClose);

  return {
    symbol: quoteData.symbol,
    price: currentPrice.toFixed(2),
    change,
    percentChange,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

module.exports = { startPolling, stopPolling, getSubscribedSymbols: () => Array.from(subscribedSymbols) };