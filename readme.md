# Stock Dashboard Backend

## Setup
1. Clone repo: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add Alpha Vantage API key (get from https://www.alphavantage.co/).
4. Start server: `npm run dev` (runs on port 5000).
5. Run tests: `npm test`

## Architecture
- **Server**: Express with Socket.io for WebSocket-based real-time updates.
- **Routes**: `/api/stocks/:symbol` (real-time quote), `/api/stocks/history/:symbol` (historical data).
- **Controllers**: Handle business logic (data fetching, processing, caching).
- **Utils**: `stockPoller.js` manages background polling for WebSocket updates (every 5s).
- **Tests**: Jest for unit (controller) and integration (routes) tests; mocks Alpha Vantage API.

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
- **Alpha Vantage Limits**: Free tier (5 calls/min, 500/day); caching reduces API calls. Use premium key for production.
- **Security**: No authentication implemented (task scope). For production, add JWT or API key middleware (e.g., `X-API-Key` header check).
- **Scalability**: In-memory cache is simple; use Redis for production.
- **CORS**: Set to `origin: '*'` for dev; restrict in production.

## Challenges/Solutions
- **Rate Limits**: In-memory cache (1-min TTL) minimizes API calls.
- **Testing**: Mocked Axios responses for reliable, offline tests.
- **Real-Time**: WebSockets with server-side polling (5s interval) balances performance and API limits.

## Running Locally
- Ensure `.env` has valid `ALPHA_VANTAGE_API_KEY`.
- Test endpoints: `curl http://localhost:5000/api/stocks/AAPL`, `curl http://localhost:5000/api/stocks/history/AAPL`.
- Test WebSockets: Use `wscat -c ws://localhost:5000`, send `{"subscribe": ["AAPL"]}`.