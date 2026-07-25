import type { AuditResult } from "./audit.service";

/**
 * In-memory cache entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL support
 */
class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; ttlMs: number } {
    return {
      size: this.store.size,
      ttlMs: this.ttlMs,
    };
  }
}

// Global audit cache
const auditCacheTtl = parseInt(process.env.CACHE_TTL_MS || "300000", 10); // 5 minutes default
export const auditCache = new Cache<AuditResult>(auditCacheTtl);

/**
 * Get cache key for a URL
 */
export function getCacheKey(url: string): string {
  return `audit:${url}`;
}

/**
 * Rate limiter using token bucket algorithm per IP
 */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private maxTokens: number;
  private refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRatePerSecond: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRatePerSecond;
  }

  /**
   * Check if a request from the given IP is allowed
   */
  isAllowed(ip: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = {
        tokens: this.maxTokens,
        lastRefill: now,
      };
      this.buckets.set(ip, bucket);
    }

    // Refill tokens based on time elapsed
    const timeSinceRefill = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timeSinceRefill * this.refillRate;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for an IP
   */
  getRemainingTokens(ip: string): number {
    const bucket = this.buckets.get(ip);
    if (!bucket) return this.maxTokens;

    const now = Date.now();
    const timeSinceRefill = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timeSinceRefill * this.refillRate;
    return Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    maxTokens: number;
    refillRatePerSecond: number;
    activeBuckets: number;
  } {
    return {
      maxTokens: this.maxTokens,
      refillRatePerSecond: this.refillRate,
      activeBuckets: this.buckets.size,
    };
  }

  /**
   * Clear all buckets (useful for testing)
   */
  clear(): void {
    this.buckets.clear();
  }
}

// Global rate limiter: 100 requests per minute per IP by default
const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS || "100", 10);
const rateLimitWindowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "60", 10);
export const rateLimiter = new RateLimiter(
  rateLimitRequests,
  rateLimitRequests / rateLimitWindowSeconds
);
