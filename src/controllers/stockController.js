const axios = require('axios');

const cache = {};
const CACHE_DURATION = 60 * 1000; 

const FMP_BASE_URL = process.env.FMP_BASE_URL;
const API_KEY = process.env.FMP_API_KEY;

const calculateChange = (currentPrice, previousClose) => {
  const change = currentPrice - previousClose;
  const percentChange = ((change / previousClose) * 100).toFixed(2);
  return { change: change.toFixed(2), percentChange };
};

exports.getStockQuote = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `quote_${symbol}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const response = await axios.get(`${FMP_BASE_URL}/quote/${symbol}`, {
      params: {
        apikey: API_KEY,
      },
    });

    const quoteData = response.data[0]; 
    if (!quoteData || !quoteData.price) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }

    const currentPrice = parseFloat(quoteData.price);
    const previousClose = parseFloat(quoteData.previousClose || quoteData.price); 
    const { change, percentChange } = calculateChange(currentPrice, previousClose);

    const stockData = {
      symbol: quoteData.symbol,
      price: currentPrice.toFixed(2),
      change,
      percentChange,
      lastUpdated: new Date().toISOString().split('T')[0], 
    };

    // Update cache
    cache[cacheKey] = { data: stockData, timestamp: now };

    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};


exports.getStockHistory = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `history_${symbol}`;
  const now = Date.now();


  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const response = await axios.get(`${FMP_BASE_URL}/historical-price-full/${symbol}`, {
      params: {
        apikey: API_KEY,
        timeseries: 100, 
      },
    });

    const timeSeries = response.data.historical;
    if (!timeSeries) {
      return res.status(404).json({ error: 'Invalid symbol or no data available' });
    }


    const historyData = timeSeries
      .map((day) => ({
        date: day.date,
        price: parseFloat(day.close).toFixed(2),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); 

    cache[cacheKey] = { data: historyData, timestamp: now };

    res.json(historyData);
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

exports.calculateChange = calculateChange;
exports.cache = cache;