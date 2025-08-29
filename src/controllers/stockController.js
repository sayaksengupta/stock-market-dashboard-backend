const axios = require('axios');

// In-memory cache to reduce API calls
const cache = {};
const CACHE_DURATION = 60 * 1000; // Cache for 1 minute

// Alpha Vantage API configuration
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Helper to calculate change and % change
const calculateChange = (currentPrice, previousClose) => {
  const change = currentPrice - previousClose;
  const percentChange = ((change / previousClose) * 100).toFixed(2);
  return { change: change.toFixed(2), percentChange };
};

// Controller: Fetch real-time stock quote
exports.getStockQuote = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `quote_${symbol}`;
  const now = Date.now();

  // Check cache
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY,
      },
    });

    const quoteData = response.data['Global Quote'];
    if (!quoteData || !quoteData['05. price']) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }

    const currentPrice = parseFloat(quoteData['05. price']);
    const previousClose = parseFloat(quoteData['08. previous close']);
    const { change, percentChange } = calculateChange(currentPrice, previousClose);

    const stockData = {
      symbol: quoteData['01. symbol'],
      price: currentPrice.toFixed(2),
      change,
      percentChange,
      lastUpdated: quoteData['07. latest trading day'],
    };

    // Update cache
    cache[cacheKey] = { data: stockData, timestamp: now };

    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};

// Controller: Fetch historical stock data for charts
exports.getStockHistory = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `history_${symbol}`;
  const now = Date.now();

  // Check cache
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact', // Last 100 days
        apikey: API_KEY,
      },
    });

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }

    // Transform data for charting
    const historyData = Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        price: parseFloat(values['4. close']).toFixed(2),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending

    // Update cache
    cache[cacheKey] = { data: historyData, timestamp: now };

    res.json(historyData);
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

exports.calculateChange = calculateChange;
exports.cache = cache;