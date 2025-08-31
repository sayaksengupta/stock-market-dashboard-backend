# Stock Dashboard Backend

## Setup

1. Clone repo: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add Financial Modeling Prep (FMP) API key (get from https://financialmodelingprep.com/developer/docs).
4. Start server: `npm run dev` (runs on port 5000).
5. Run tests: `npm test`

## Architecture

- **Server**: Express with Socket.io for WebSocket-based real-time updates.
- **Routes**: `/api/stocks/:symbol` (real-time quote), `/api/stocks/history/:symbol` (historical data).
- **Controllers**: Handle business logic (data fetching, processing, caching).
- **Utils**: `stockPoller.js` manages background polling for WebSocket updates (every 5s).
- **Tests**: Jest for unit (controller) and integration (routes) tests; mocks FMP API.

## Technologies

- Node.js, Express, Socket.io, Axios, Jest, Supertest.

## Testing

- Run `npm test` for unit and integration tests.
- Tests mock API calls to avoid rate limits.
- Coverage: Focuses on controller logic, routes, and cache behavior.

## Real-Time Updates

- Clients connect via WebSocket (`ws://localhost:5000`).
- Send `{"subscribe": ["AAPL", "MSFT"]}` to receive updates every 5s.
- Send `{"unsubscribe": ["AAPL"]}` to stop updates.

## Considerations

- **FMP Limits**: Free tier (250 calls/day, ~5 calls/minute); caching reduces API calls. Use premium key ($19/month) for production-scale use.
- **Security**: No authentication implemented (task scope). For production, add JWT or API key middleware (e.g., `X-API-Key` header check).
- **Scalability**: In-memory cache is simple; use Redis for production.
- **CORS**: Set to `origin: '*'` for dev; restrict in production.

## Challenges/Solutions

- **Rate Limits**: Switched from Alpha Vantage (25 calls/day limit) to FMP (250 calls/day). In-memory cache (1-min TTL) minimizes API calls.
- **Testing**: Mocked Axios responses for reliable, offline tests.
- **Real-Time**: WebSockets with server-side polling (5s interval) balances performance and API limits.

## Running Locally

- Ensure `.env` has valid `FMP_API_KEY`.
- Test endpoints: `curl http://localhost:5000/api/stocks/AAPL`, `curl http://localhost:5000/api/stocks/history/AAPL`.
- Test WebSockets: Use `wscat -c ws://localhost:5000`, send `{"subscribe": ["AAPL"]}`.

## Notes

- **API Switch**: Due to Alpha Vantage's restrictive 25 requests/day limit causing errors, the backend now uses Financial Modeling Prep (FMP). FMP provides 250 requests/day on the free tier, suitable for this project with caching. Update your `.env` with an FMP API key from https://financialmodelingprep.com/developer/docs.
- **Troubleshooting**: If API errors occur, verify `FMP_API_KEY` with `curl https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=your_key`. Adjust `CACHE_DURATION` in `stockController.js` if rate limits are hit.
