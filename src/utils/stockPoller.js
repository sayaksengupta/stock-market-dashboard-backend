const axios = require('axios');

// Reuse controller helpers for consistency
const { calculateChange } = require('../controllers/stockController'); // Assuming we export this; add export if needed

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
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
  const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: API_KEY,
    },
  });

  const quoteData = response.data['Global Quote'];
  if (!quoteData || !quoteData['05. price']) {
    throw new Error('Invalid data');
  }

  const currentPrice = parseFloat(quoteData['05. price']);
  const previousClose = parseFloat(quoteData['08. previous close']);
  const { change, percentChange } = calculateChange(currentPrice, previousClose);

  return {
    symbol: quoteData['01. symbol'],
    price: currentPrice.toFixed(2),
    change,
    percentChange,
    lastUpdated: quoteData['07. latest trading day'],
  };
}

module.exports = { startPolling, stopPolling, getSubscribedSymbols: () => Array.from(subscribedSymbols) };