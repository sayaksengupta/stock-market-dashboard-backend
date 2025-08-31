const axios = require('axios');

// In-memory cache to reduce API calls
const cache = {};
const CACHE_DURATION = 60 * 1000; // Cache for 1 minute

// Financial Modeling Prep API configuration
const FMP_BASE_URL = process.env.FMP_BASE_URL;
const API_KEY = process.env.FMP_API_KEY;

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
    const response = await axios.get(`${FMP_BASE_URL}/quote/${symbol}`, {
      params: {
        apikey: API_KEY,
      },
    });

    const quoteData = response.data[0]; // FMP returns an array
    if (!quoteData || !quoteData.price) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }

    const currentPrice = parseFloat(quoteData.price);
    const previousClose = parseFloat(quoteData.previousClose || quoteData.price); // Fallback if no previousClose
    const { change, percentChange } = calculateChange(currentPrice, previousClose);

    const stockData = {
      symbol: quoteData.symbol,
      price: currentPrice.toFixed(2),
      change,
      percentChange,
      lastUpdated: new Date().toISOString().split('T')[0], // Current date as FMP doesn't provide trading day
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
    const response = await axios.get(`${FMP_BASE_URL}/historical-price-full/${symbol}`, {
      params: {
        apikey: API_KEY,
        timeseries: 100, // Last 100 days
      },
    });

    const timeSeries = response.data.historical;
    if (!timeSeries) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }

    // Transform data for charting
    const historyData = timeSeries
      .map((day) => ({
        date: day.date,
        price: parseFloat(day.close).toFixed(2),
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