# Page Pulse - Production URL Audit Service

A production-grade URL auditing service built with Node.js, React, and TypeScript. Features real-time URL analysis with caching, rate limiting, structured logging, and a cyberpunk-themed dashboard.

## Features

- **URL Audit Service**: Fetch and analyze URLs with configurable timeouts and concurrency limits
- **In-Memory Caching**: Configurable TTL cache for audit results to reduce redundant fetches
- **Rate Limiting**: Per-IP rate limiting using token bucket algorithm
- **Structured Logging**: JSON-formatted logs with unique request IDs for tracing
- **Cyberpunk UI**: Modern, high-contrast interface with neon effects
- **Audit History**: Persistent storage of all audit results
- **Production-Ready**: Comprehensive error handling, validation, and monitoring

## Architecture

### Components

- **Frontend**: React 19 with Tailwind CSS and shadcn/ui components
- **Backend**: Express.js with tRPC for type-safe API
- **Database**: MySQL with Drizzle ORM
- **Caching**: In-memory cache with configurable TTL
- **Rate Limiting**: Token bucket algorithm per IP address
- **Logging**: Structured JSON logging with request IDs

### Data Flow

1. User submits URL via frontend form
2. tRPC client sends request to `audit.performAudit` procedure
3. Context middleware generates unique requestId and sets X-Request-ID header
4. Rate limiter checks if client IP is within limits
5. Cache layer checks for existing audit result
6. If cache miss: Audit service fetches URL with timeout and concurrency control
7. Result is cached and saved to database (if user authenticated)
8. Response returned with X-Request-ID and X-Cache headers

## API Contract

### Endpoints

#### `audit.performAudit` (Public Mutation)

Performs a URL audit with caching and rate limiting.

**Input:**
```typescript
{
  url: string  // URL to audit (required, max 2048 chars, must be HTTP/HTTPS)
}
```

**Output:**
```typescript
{
  requestId: string           // Unique request identifier
  url: string                 // The audited URL
  statusCode?: number         // HTTP status code
  responseTime: number        // Response time in milliseconds
  contentType?: string        // Content-Type header
  contentLength?: number      // Content length in bytes
  title?: string              // Page title from <title> tag
  metaDescription?: string    // Meta description tag
  redirectChain: string[]     // Array of redirect URLs
  error?: string              // Error message if audit failed
  headers?: Record<string, string>  // Response headers
  cachedAt?: Date             // Timestamp if served from cache
}
```

**Response Headers:**
- `X-Request-ID`: Unique request identifier for tracing
- `X-Cache`: "HIT" if served from cache, "MISS" otherwise
- `Retry-After`: "60" if rate limit exceeded

**Error Responses:**
```typescript
{
  code: "UNPROCESSABLE_CONTENT" | "TOO_MANY_REQUESTS" | "BAD_REQUEST"
  message: string
  data?: {
    code: string
    httpStatus: number
  }
}
```

#### `audit.getHistory` (Protected Query)

Retrieves audit history for authenticated user.

**Input:**
```typescript
{
  limit?: number    // Number of records (default: 50)
  offset?: number   // Pagination offset (default: 0)
}
```

**Output:**
```typescript
Array<{
  id: number
  userId: number
  url: string
  statusCode?: number
  responseTime: number
  contentType?: string
  contentLength?: number
  title?: string
  metaDescription?: string
  redirectChain: string[]
  error?: string
  headers?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}>
```

#### `audit.getCacheStats` (Public Query)

Returns cache statistics.

**Output:**
```typescript
{
  size: number      // Number of cached entries
  ttlMs: number     // Cache TTL in milliseconds
}
```

#### `audit.getRateLimiterStats` (Public Query)

Returns rate limiter statistics.

**Output:**
```typescript
{
  maxTokens: number              // Maximum tokens per bucket
  refillRatePerSecond: number    // Tokens refilled per second
  activeBuckets: number          // Number of active IP buckets
}
```

## Environment Variables

### Required

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session cookie signing secret

### Optional (with defaults)

- `AUDIT_TIMEOUT_MS`: Request timeout in milliseconds (default: 10000)
- `AUDIT_CONCURRENCY_LIMIT`: Max concurrent audit requests (default: 10)
- `CACHE_TTL_MS`: Cache TTL in milliseconds (default: 300000 / 5 minutes)
- `RATE_LIMIT_REQUESTS`: Max requests per window (default: 100)
- `RATE_LIMIT_WINDOW_SECONDS`: Rate limit window in seconds (default: 60)

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_URL` | 400 | URL validation failed |
| `REQUEST_TIMEOUT` | 408 | Audit request exceeded timeout |
| `RATE_LIMIT_EXCEEDED` | 429 | Client exceeded rate limit |
| `FETCH_ERROR` | 500 | Error fetching the URL |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |

## Deployment

### Prerequisites

- Node.js 22+
- MySQL 8.0+
- pnpm 10.4+

### Local Development

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

### Docker Deployment

The project includes a Dockerfile for containerized deployment. Build and run:

```bash
docker build -t page-pulse-audit .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e JWT_SECRET="your-secret-key" \
  page-pulse-audit
```

## Monitoring & Observability

### Request Tracing

Every request receives a unique `requestId` (format: `req_*`) that:
- Is included in the `X-Request-ID` response header
- Appears in all structured logs
- Enables end-to-end request tracing

### Structured Logging

Logs are JSON-formatted with the following structure:
```json
{
  "requestId": "req_abc123",
  "timestamp": "2026-07-25T05:50:00.000Z",
  "level": "info|warn|error|debug",
  "message": "Audit completed",
  "data": {
    "url": "https://example.com",
    "responseTime": 245,
    "statusCode": 200
  }
}
```

### Metrics

Access statistics via public endpoints:
- `audit.getCacheStats`: Cache hit/miss ratios
- `audit.getRateLimiterStats`: Rate limiter bucket counts

## Scaling to 10,000 Audits/Day

For production deployments handling 10,000+ audits per day:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Distributed Cache**: Replace in-memory cache with Redis for cross-instance sharing
3. **Message Queue**: Use RabbitMQ/Kafka for async audit processing
4. **Worker Pool**: Dedicated workers for URL fetching
5. **Database Optimization**: Add indexes on userId/url/createdAt; use read replicas
6. **Monitoring**: Prometheus metrics, Grafana dashboards, alerting

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

## Architecture Decisions

### In-Memory Cache vs Redis

**Chosen**: In-memory cache for simplicity and low latency in single-instance deployments.

**Rejected**: Redis adds operational complexity and network latency; suitable only for multi-instance setups.

### Token Bucket Rate Limiter

**Chosen**: Token bucket algorithm for smooth rate limiting with burst tolerance.

**Rejected**: Fixed window counters cause hard cutoffs; sliding window requires more memory.

### Semaphore for Concurrency

**Chosen**: Semaphore pattern for bounded concurrent requests.

**Rejected**: Unbounded concurrency risks resource exhaustion; queue systems add complexity.

### Structured JSON Logging

**Chosen**: Structured logs with requestId for correlation and debugging.

**Rejected**: Unstructured logs are harder to parse and correlate across requests.

## Failure Modes & Mitigations

### Target URL Timeout
**Mitigation**: Configurable timeout (default 10s) with AbortController. Returns structured error response with requestId.

### Rate Limit Exhaustion
**Mitigation**: Token bucket refills over time. Returns Retry-After header. Configurable limits per environment.

### Memory Exhaustion (Cache)
**Mitigation**: Configurable TTL ensures entries expire. For production scale, migrate to Redis.

### Database Connection Failure
**Mitigation**: Audit service works without database (public audits). Graceful degradation with error logging.

### Concurrent Request Spike
**Mitigation**: Semaphore limits concurrent fetches (default 10). Excess requests queue.

## CI/CD

GitHub Actions workflow runs on every push:
- Type checking with TypeScript
- Unit tests with Vitest
- Production build verification

See `.github/workflows/test.yml` for configuration.

## License

MIT

## Built for Digital Heroes Training Task

This service was built as part of the Digital Heroes training program. Visit [digitalheroesco.com](https://digitalheroesco.com) for more information.
