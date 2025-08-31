const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { getStockQuote, getStockHistory, calculateChange, cache } = require('../src/controllers/stockController');

const mock = new MockAdapter(axios);

describe('Stock Controller', () => {
  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockReturnValue(new Date('2025-08-30T00:00:00Z').getTime());
    Object.keys(cache).forEach(key => delete cache[key]);
  });

  afterEach(() => {
    mock.reset();
    jest.restoreAllMocks();
  });

  test('calculateChange computes correctly', () => {
    const result = calculateChange(100, 90);
    expect(result).toEqual({ change: '10.00', percentChange: '11.11' });
  });

  test('getStockQuote fetches and processes data', async () => {
    mock.onGet(/quote/).reply(200, [
      { symbol: 'AAPL', price: 150.00, previousClose: 145.00 }
    ]);

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockQuote(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      symbol: 'AAPL',
      price: '150.00',
      change: '5.00',
      percentChange: '3.45',
    }));
  });

  test('getStockQuote uses cache if available', async () => {
    const cacheKey = 'quote_AAPL';
    const cachedData = {
      data: { symbol: 'AAPL', price: '150.00', change: '5.00', percentChange: '3.45' },
      timestamp: Date.now(),
    };
    cache[cacheKey] = cachedData;

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockQuote(req, res);
    expect(res.json).toHaveBeenCalledWith(cachedData.data);
    expect(mock.history.get.length).toBe(0);
  });

  test('getStockQuote updates cache on new fetch', async () => {
    mock.onGet(/quote/).reply(200, [
      { symbol: 'AAPL', price: 150.00, previousClose: 145.00 }
    ]);

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockQuote(req, res);
    expect(cache['quote_AAPL']).toBeDefined();
    expect(cache['quote_AAPL'].data).toMatchObject({
      symbol: 'AAPL',
      price: '150.00',
    });
  });

  test('getStockQuote handles invalid symbol', async () => {
    mock.onGet(/quote/).reply(200, []);

    const req = { params: { symbol: 'invalid' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockQuote(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid symbol or no data available' });
  });

  test('getStockQuote handles API error', async () => {
    mock.onGet(/quote/).reply(500);

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockQuote(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch stock data' });
  });

  test('getStockHistory fetches and transforms data', async () => {
    mock.onGet(/historical-price-full/).reply(200, {
      historical: [
        { date: '2025-08-29', close: 145.00 },
        { date: '2025-08-30', close: 150.00 },
      ],
    });

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockHistory(req, res);
    expect(res.json).toHaveBeenCalledWith([
      { date: '2025-08-29', price: '145.00' },
      { date: '2025-08-30', price: '150.00' },
    ]);
  });

  test('getStockHistory uses cache if available', async () => {
    const cacheKey = 'history_AAPL';
    const cachedData = {
      data: [{ date: '2025-08-29', price: '145.00' }],
      timestamp: Date.now(),
    };
    cache[cacheKey] = cachedData;

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockHistory(req, res);
    expect(res.json).toHaveBeenCalledWith(cachedData.data);
    expect(mock.history.get.length).toBe(0);
  });

  test('getStockHistory updates cache on new fetch', async () => {
    mock.onGet(/historical-price-full/).reply(200, {
      historical: [{ date: '2025-08-30', close: 150.00 }],
    });

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockHistory(req, res);
    expect(cache['history_AAPL']).toBeDefined();
    expect(cache['history_AAPL'].data).toHaveLength(1);
  });

  test('getStockHistory handles API error', async () => {
    mock.onGet(/historical-price-full/).reply(500);

    const req = { params: { symbol: 'aapl' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await getStockHistory(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch historical data' });
  });
});
