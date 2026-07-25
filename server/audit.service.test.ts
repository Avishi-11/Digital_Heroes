import { describe, it, expect, beforeEach } from "vitest";
import {
  validateUrl,
  performAudit,
  generateRequestId,
  createErrorResponse,
} from "./audit.service";
import { RateLimiter, auditCache } from "./cache.service";

describe("Audit Service", () => {
  describe("validateUrl", () => {
    it("should accept valid HTTP URLs", () => {
      const result = validateUrl("http://example.com");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid HTTPS URLs", () => {
      const result = validateUrl("https://example.com/path");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty URLs", () => {
      const result = validateUrl("");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject non-string URLs", () => {
      const result = validateUrl(null as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject URLs exceeding 2048 characters", () => {
      const longUrl = "https://example.com/" + "a".repeat(2050);
      const result = validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum length");
    });

    it("should reject URLs with invalid protocol", () => {
      const result = validateUrl("ftp://example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("HTTP or HTTPS");
    });

    it("should reject malformed URLs", () => {
      const result = validateUrl("not a valid url");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL format");
    });

    it("should trim whitespace", () => {
      const result = validateUrl("  https://example.com  ");
      expect(result.valid).toBe(true);
    });
  });

  describe("generateRequestId", () => {
    it("should generate unique request IDs", () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it("should start with req_ prefix", () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req_/);
    });

    it("should have consistent length", () => {
      const id = generateRequestId();
      expect(id.length).toBeGreaterThan(4);
    });
  });

  describe("createErrorResponse", () => {
    it("should create properly structured error response", () => {
      const response = createErrorResponse(
        "req_test",
        "Test error",
        "TEST_ERROR",
        400
      );

      expect(response).toHaveProperty("requestId", "req_test");
      expect(response).toHaveProperty("error", "Test error");
      expect(response).toHaveProperty("code", "TEST_ERROR");
      expect(response).toHaveProperty("statusCode", 400);
      expect(response).toHaveProperty("timestamp");
    });

    it("should include ISO timestamp", () => {
      const response = createErrorResponse(
        "req_test",
        "Error",
        "ERROR",
        500
      );
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("performAudit", () => {
    it("should return validation error for invalid URL", async () => {
      const result = await performAudit("invalid", "req_test");
      expect(result.error).toBeDefined();
      expect(result.statusCode).toBeUndefined();
    });

    it("should include requestId in result", async () => {
      const result = await performAudit("https://example.com", "req_custom");
      expect(result.requestId).toBe("req_custom");
    });

    it("should include responseTime", async () => {
      const result = await performAudit("https://example.com", "req_test");
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it("should include URL in result", async () => {
      const url = "https://example.com";
      const result = await performAudit(url, "req_test");
      expect(result.url).toBe(url);
    });
  });
});

describe("Rate Limiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(10, 10); // 10 tokens per second
  });

  it("should allow requests within limit", () => {
    const ip = "192.168.1.1";
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed(ip)).toBe(true);
    }
  });

  it("should reject requests exceeding limit", () => {
    const ip = "192.168.1.1";
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed(ip);
    }
    expect(limiter.isAllowed(ip)).toBe(false);
  });

  it("should track separate limits per IP", () => {
    const ip1 = "192.168.1.1";
    const ip2 = "192.168.1.2";

    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed(ip1)).toBe(true);
    }

    expect(limiter.isAllowed(ip1)).toBe(false);
    expect(limiter.isAllowed(ip2)).toBe(true);
  });

  it("should return correct remaining tokens", () => {
    const ip = "192.168.1.1";
    limiter.isAllowed(ip);
    const remaining = limiter.getRemainingTokens(ip);
    expect(remaining).toBeLessThan(10);
  });

  it("should provide statistics", () => {
    const stats = limiter.getStats();
    expect(stats).toHaveProperty("maxTokens", 10);
    expect(stats).toHaveProperty("refillRatePerSecond", 10);
    expect(stats).toHaveProperty("activeBuckets");
  });

  it("should clear all buckets", () => {
    const ip = "192.168.1.1";
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed(ip);
    }
    limiter.clear();
    expect(limiter.isAllowed(ip)).toBe(true);
  });
});

describe("Audit Cache", () => {
  beforeEach(() => {
    auditCache.clear();
  });

  it("should cache and retrieve values", () => {
    const key = "test_key";
    const value = {
      requestId: "req_test",
      url: "https://example.com",
      responseTime: 100,
      redirectChain: [],
    };

    auditCache.set(key, value);
    const cached = auditCache.get(key);

    expect(cached).toEqual(value);
  });

  it("should return null for missing keys", () => {
    const cached = auditCache.get("nonexistent");
    expect(cached).toBeNull();
  });

  it("should check key existence", () => {
    const key = "test_key";
    const value = {
      requestId: "req_test",
      url: "https://example.com",
      responseTime: 100,
      redirectChain: [],
    };

    auditCache.set(key, value);
    expect(auditCache.has(key)).toBe(true);
    expect(auditCache.has("nonexistent")).toBe(false);
  });

  it("should provide cache statistics", () => {
    const stats = auditCache.getStats();
    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("ttlMs");
  });

  it("should clear all entries", () => {
    auditCache.set("key1", {
      requestId: "req_test",
      url: "https://example.com",
      responseTime: 100,
      redirectChain: [],
    });
    auditCache.clear();
    expect(auditCache.get("key1")).toBeNull();
  });
});
