# Page Pulse - Production URL Audit Service

🚀 **[Live Demo](https://pagepulse-jnuy6kes.manus.space)** | 📚 **[Architecture Documentation](./ARCHITECTURE.md)**

A production-grade URL auditing service built with Node.js, React, and TypeScript. Features real-time URL analysis with caching, rate limiting, structured logging, and a cyberpunk-themed dashboard.

## Features

- **URL Audit Service**: Fetch and analyze URLs with configurable timeouts and concurrency limits
- **In-Memory Caching**: Configurable TTL cache for audit results to reduce redundant fetches
- **Rate Limiting**: Per-IP rate limiting using token bucket algorithm
- **Structured Logging**: JSON-formatted logs with unique request IDs for tracing
- **Cyberpunk UI**: Modern, high-contrast interface with neon effects
- **Audit History**: Persistent storage of all audit results
- **Production-Ready**: Comprehensive error handling, validation, and monitoring

## Quick Start

### Prerequisites
- Node.js 22+
- MySQL 8.0+
- pnpm 10.4+

### Development

```bash
# Install dependencies
pnpm install

# Generate database migration
pnpm drizzle-kit generate

# Apply migrations
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## API Contract

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `audit.performAudit` | POST | Performs a URL audit with caching and rate limiting |
| `audit.getHistory` | GET | Retrieves audit history for authenticated user |
| `audit.getCacheStats` | GET | Returns cache statistics |
| `audit.getRateLimiterStats` | GET | Returns rate limiter statistics |

### Response Headers

- `X-Request-ID`: Unique request identifier for tracing
- `X-Cache`: "HIT" if served from cache, "MISS" otherwise
- `Retry-After`: Seconds to wait if rate limit exceeded

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_URL` | 400 | URL validation failed |
| `REQUEST_TIMEOUT` | 408 | Audit request exceeded timeout |
| `RATE_LIMIT_EXCEEDED` | 429 | Client exceeded rate limit |
| `FETCH_ERROR` | 500 | Error fetching the URL |

## Architecture

For comprehensive architecture documentation, including system design, data flow, technology decisions, failure modes, and scaling strategy, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Testing

Run the comprehensive test suite:

```bash
pnpm test
```

Test coverage includes:
- URL validation
- Audit service with timeout and concurrency
- Caching logic and TTL expiration
- Rate limiting per IP
- Error handling and structured responses
- Request ID generation and propagation

## CI/CD

GitHub Actions workflow runs on every push:
- Type checking with TypeScript
- Unit tests with Vitest
- Production build verification

See `.github/workflows/test.yml` for configuration.

## Built for Digital Heroes Training Task

This service was built as part of the Digital Heroes training program. Visit [digitalheroesco.com](https://digitalheroesco.com) for more information.

## License

MIT
