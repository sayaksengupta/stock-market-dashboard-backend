const request = require('supertest');
const express = require('express');
const stockRoutes = require('../src/routes/stocks');
const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');

const app = express();
app.use('/api/stocks', stockRoutes);

const mock = new MockAdapter(axios);

describe('Stock Routes', () => {
  afterEach(() => {
    mock.reset();
  });

  test('GET /api/stocks/:symbol returns quote', async () => {
    mock.onGet().reply(200, {
      'Global Quote': {
        '01. symbol': 'AAPL',
        '05. price': '150.00',
        '08. previous close': '145.00',
        '07. latest trading day': '2025-08-30'
      }
    });

    const response = await request(app).get('/api/stocks/aapl');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      symbol: 'AAPL',
      price: '150.00',
      change: '5.00',
      percentChange: '3.45'
    });
  });

  test('GET /api/stocks/history/:symbol returns history', async () => {
    mock.onGet().reply(200, {
      'Time Series (Daily)': {
        '2025-08-30': { '4. close': '150.00' }
      }
    });

    const response = await request(app).get('/api/stocks/history/aapl');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('date');
    expect(response.body[0]).toHaveProperty('price');
  });
});