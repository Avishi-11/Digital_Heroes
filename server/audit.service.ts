import { nanoid } from "nanoid";

/**
 * Structured audit result returned by the service
 */
export interface AuditResult {
  requestId: string;
  url: string;
  statusCode?: number;
  responseTime: number;
  contentType?: string;
  contentLength?: number;
  title?: string;
  metaDescription?: string;
  redirectChain: string[];
  error?: string;
  headers?: Record<string, string>;
  cachedAt?: Date;
}

/**
 * Structured error response
 */
export interface ErrorResponse {
  requestId: string;
  error: string;
  code: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Validate URL format and protocol
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required and must be a string" };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "URL cannot be empty" };
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: "URL exceeds maximum length of 2048 characters" };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith("http")) {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Semaphore for concurrency limiting
 */
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    const waiter = this.waitQueue.shift();
    if (waiter) {
      this.permits--;
      waiter();
    }
  }
}

// Global semaphore for concurrency limiting
const auditSemaphore = new Semaphore(
  parseInt(process.env.AUDIT_CONCURRENCY_LIMIT || "10", 10)
);

/**
 * Extract metadata from HTML response
 */
function extractMetadata(
  html: string
): { title?: string; metaDescription?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim();

  const metaMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
  );
  const metaDescription = metaMatch?.[1]?.trim();

  return { title, metaDescription };
}

/**
 * Extract redirect chain from response headers
 */
function extractRedirectChain(
  headers: Record<string, string | string[]>
): string[] {
  const chain: string[] = [];
  const location = headers["location"];
  if (location) {
    const loc = Array.isArray(location) ? location[0] : location;
    if (loc) chain.push(loc);
  }
  return chain;
}

/**
 * Perform URL audit with timeout and error handling
 */
export async function performAudit(
  url: string,
  requestId: string
): Promise<AuditResult> {
  const startTime = Date.now();

  // Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    return {
      requestId,
      url,
      responseTime: Date.now() - startTime,
      redirectChain: [],
      error: validation.error,
    };
  }

  // Acquire semaphore permit
  await auditSemaphore.acquire();

  try {
    const timeout = parseInt(process.env.AUDIT_TIMEOUT_MS || "10000", 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "PagePulseAudit/1.0 (+https://pagepulse.audit)",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || undefined;
      const contentLength = response.headers.get("content-length");
      const redirectChain = extractRedirectChain(
        Object.fromEntries(response.headers.entries())
      );

      let title: string | undefined;
      let metaDescription: string | undefined;

      // Extract metadata from HTML responses
      if (contentType?.includes("text/html")) {
        try {
          const text = await response.text();
          const metadata = extractMetadata(text);
          title = metadata.title;
          metaDescription = metadata.metaDescription;
        } catch (e) {
          // Silently ignore metadata extraction errors
        }
      }

      return {
        requestId,
        url,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        contentType: contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        title,
        metaDescription,
        redirectChain,
        headers: Object.fromEntries(
          Array.from(response.headers.entries()).slice(0, 20)
        ),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            requestId,
            url,
            responseTime: Date.now() - startTime,
            redirectChain: [],
            error: `Request timeout after ${timeout}ms`,
          };
        }
        return {
          requestId,
          url,
          responseTime: Date.now() - startTime,
          redirectChain: [],
          error: error.message,
        };
      }

      return {
        requestId,
        url,
        responseTime: Date.now() - startTime,
        redirectChain: [],
        error: "Unknown error occurred",
      };
    }
  } finally {
    auditSemaphore.release();
  }
}

/**
 * Create structured error response
 */
export function createErrorResponse(
  requestId: string,
  error: string,
  code: string,
  statusCode: number
): ErrorResponse {
  return {
    requestId,
    error,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${nanoid(12)}`;
}
