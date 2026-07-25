import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Architecture() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-black">
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              ARCHITECTURE
            </span>
          </h1>
        </div>

        {/* System Overview */}
        <Card className="bg-black border-2 border-cyan-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">System Components</h2>
          <div className="space-y-4 text-white">
            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Frontend Layer (React + Tailwind)</p>
              <p className="text-sm">
                Cyberpunk-styled UI for URL submission, audit results display, and history viewing.
                Uses tRPC for type-safe backend communication.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-4">
              <p className="font-mono text-cyan-400 mb-2">API Layer (Express + tRPC)</p>
              <p className="text-sm">
                Handles HTTP requests, routes them to tRPC procedures, manages authentication,
                and applies middleware for logging and error handling.
              </p>
            </div>

            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Audit Service</p>
              <p className="text-sm">
                Core business logic for URL fetching, validation, timeout management, and metadata
                extraction. Implements semaphore-based concurrency limiting.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-4">
              <p className="font-mono text-cyan-400 mb-2">Cache Layer (In-Memory)</p>
              <p className="text-sm">
                Configurable TTL cache for audit results. Reduces redundant fetches and improves
                response times for frequently audited URLs.
              </p>
            </div>

            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Rate Limiter (Token Bucket)</p>
              <p className="text-sm">
                Per-IP rate limiting using token bucket algorithm. Configurable request limits and
                refill rates to prevent abuse.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-4">
              <p className="font-mono text-cyan-400 mb-2">Database Layer (MySQL)</p>
              <p className="text-sm">
                Persistent storage for user accounts and audit history. Uses Drizzle ORM for
                type-safe database operations.
              </p>
            </div>
          </div>
        </Card>

        {/* Data Flow */}
        <Card className="bg-black border-2 border-pink-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">Data Flow</h2>
          <div className="space-y-3 text-white font-mono text-sm">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">1.</span>
              <span>User submits URL via frontend form</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">2.</span>
              <span>tRPC client sends request to audit.performAudit procedure</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">3.</span>
              <span>Context middleware generates unique requestId and sets X-Request-ID header</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">4.</span>
              <span>Rate limiter checks if client IP is within limits</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">5.</span>
              <span>Cache layer checks for existing audit result</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">6.</span>
              <span>If cache miss: Audit service fetches URL with timeout and concurrency control</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">7.</span>
              <span>Result is cached and saved to database (if user authenticated)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-cyan-400">8.</span>
              <span>Response returned to frontend with X-Request-ID and X-Cache headers</span>
            </div>
          </div>
        </Card>

        {/* Technology Decisions */}
        <Card className="bg-black border-2 border-cyan-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Technology Decisions</h2>
          <div className="space-y-6 text-white">
            <div>
              <p className="font-mono text-pink-500 mb-2">tRPC over REST</p>
              <p className="text-sm">
                <strong>Chosen:</strong> tRPC for end-to-end type safety and automatic client
                generation.
                <br />
                <strong>Rejected:</strong> REST API would require manual schema validation and
                separate client generation.
              </p>
            </div>

            <div>
              <p className="font-mono text-pink-500 mb-2">In-Memory Cache over Redis</p>
              <p className="text-sm">
                <strong>Chosen:</strong> In-memory cache for simplicity and low latency in
                single-instance deployment.
                <br />
                <strong>Rejected:</strong> Redis adds operational complexity and network latency;
                suitable only for multi-instance deployments.
              </p>
            </div>

            <div>
              <p className="font-mono text-pink-500 mb-2">Token Bucket Rate Limiter</p>
              <p className="text-sm">
                <strong>Chosen:</strong> Token bucket algorithm for smooth rate limiting with burst
                tolerance.
                <br />
                <strong>Rejected:</strong> Fixed window counters would cause hard cutoffs; sliding
                window requires more memory.
              </p>
            </div>

            <div>
              <p className="font-mono text-pink-500 mb-2">Semaphore for Concurrency</p>
              <p className="text-sm">
                <strong>Chosen:</strong> Semaphore pattern for bounded concurrent requests.
                <br />
                <strong>Rejected:</strong> Unbounded concurrency risks resource exhaustion; queue
                systems add complexity.
              </p>
            </div>

            <div>
              <p className="font-mono text-pink-500 mb-2">Structured JSON Logging</p>
              <p className="text-sm">
                <strong>Chosen:</strong> Structured logs with requestId for correlation and
                debugging.
                <br />
                <strong>Rejected:</strong> Unstructured logs are harder to parse and correlate
                across requests.
              </p>
            </div>
          </div>
        </Card>

        {/* Failure Modes */}
        <Card className="bg-black border-2 border-pink-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">Failure Modes & Mitigations</h2>
          <div className="space-y-6 text-white">
            <div>
              <p className="font-mono text-cyan-400 mb-2">
                1. Target URL Timeout or Unreachable
              </p>
              <p className="text-sm mb-2">
                <strong>Mitigation:</strong> Configurable timeout (default 10s) with AbortController.
                Returns structured error response with requestId. User can retry or try different
                URL.
              </p>
            </div>

            <div>
              <p className="font-mono text-cyan-400 mb-2">2. Rate Limit Exhaustion</p>
              <p className="text-sm mb-2">
                <strong>Mitigation:</strong> Token bucket refills over time. Returns Retry-After
                header. Configurable limits per environment. Per-IP isolation prevents one client
                from affecting others.
              </p>
            </div>

            <div>
              <p className="font-mono text-cyan-400 mb-2">3. Memory Exhaustion (Cache)</p>
              <p className="text-sm mb-2">
                <strong>Mitigation:</strong> Configurable TTL ensures entries expire. In-memory
                cache is bounded by TTL. For production scale, migrate to Redis with eviction
                policies.
              </p>
            </div>

            <div>
              <p className="font-mono text-cyan-400 mb-2">4. Database Connection Failure</p>
              <p className="text-sm mb-2">
                <strong>Mitigation:</strong> Audit service works without database (public audits).
                Audit history only saved for authenticated users. Graceful degradation with error
                logging.
              </p>
            </div>

            <div>
              <p className="font-mono text-cyan-400 mb-2">5. Concurrent Request Spike</p>
              <p className="text-sm mb-2">
                <strong>Mitigation:</strong> Semaphore limits concurrent fetches (default 10).
                Excess requests queue. Configurable concurrency limit per environment.
              </p>
            </div>
          </div>
        </Card>

        {/* Observability */}
        <Card className="bg-black border-2 border-cyan-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Observability & Monitoring</h2>
          <div className="space-y-4 text-white">
            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Request Tracing</p>
              <p className="text-sm">
                Every request gets unique requestId. Included in X-Request-ID response header and
                all structured logs. Enables end-to-end tracing.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-4">
              <p className="font-mono text-cyan-400 mb-2">Cache Metrics</p>
              <p className="text-sm">
                Endpoint: audit.getCacheStats returns cache size and TTL. X-Cache header (HIT/MISS)
                on every audit response.
              </p>
            </div>

            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Rate Limit Metrics</p>
              <p className="text-sm">
                Endpoint: audit.getRateLimiterStats returns active buckets and token counts. Logs
                include rate limit rejections with client IP.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-4">
              <p className="font-mono text-cyan-400 mb-2">Structured Logs</p>
              <p className="text-sm">
                JSON-formatted logs with timestamp, level, requestId, message, and contextual data.
                Enables log aggregation and analysis.
              </p>
            </div>

            <div className="border-l-2 border-pink-500 pl-4">
              <p className="font-mono text-pink-500 mb-2">Rollback Strategy</p>
              <p className="text-sm">
                Git-based versioning with checkpoint system. Bad deploy can be rolled back via
                previous commit. Database migrations are reversible. Cache is ephemeral (no data
                loss).
              </p>
            </div>
          </div>
        </Card>

        {/* Scaling for 10,000 Audits/Day */}
        <Card className="bg-black border-2 border-pink-500 rounded-none mb-8 p-8">
          <h2 className="text-2xl font-bold text-pink-500 mb-4">Scaling to 10,000 Audits/Day</h2>
          <div className="space-y-4 text-white text-sm">
            <p>
              <strong>Current Architecture:</strong> Single-instance Node.js with in-memory cache.
              Suitable for ~1,000 audits/day.
            </p>

            <p>
              <strong>For 10,000 audits/day:</strong>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Horizontal Scaling:</strong> Deploy multiple instances behind load balancer
              </li>
              <li>
                <strong>Distributed Cache:</strong> Replace in-memory cache with Redis for
                cross-instance sharing
              </li>
              <li>
                <strong>Queue System:</strong> Use message queue (RabbitMQ/Kafka) for async audit
                processing
              </li>
              <li>
                <strong>Worker Pool:</strong> Dedicated workers for URL fetching to isolate from
                API layer
              </li>
              <li>
                <strong>Database Optimization:</strong> Add indexes on userId/url/createdAt;
                consider read replicas
              </li>
              <li>
                <strong>Monitoring:</strong> Prometheus metrics, Grafana dashboards, alerting on
                latency/error rates
              </li>
            </ul>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-cyan-500/30 text-center">
          <p className="text-cyan-400 text-sm">
            Built for{" "}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-400 font-bold underline"
            >
              Digital Heroes Training Task
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
