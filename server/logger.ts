/**
 * Structured logging with request ID tracking
 */

export interface LogContext {
  requestId: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Format log entry as JSON for structured logging
 */
function formatLogEntry(context: LogContext): string {
  return JSON.stringify({
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Logger instance with request ID context
 */
export class Logger {
  private requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const entry: LogContext = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      data,
    };
    console.log(formatLogEntry(entry));
  }

  info(message: string, data?: Record<string, unknown>): void {
    const entry: LogContext = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      data,
    };
    console.log(formatLogEntry(entry));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const entry: LogContext = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      data,
    };
    console.warn(formatLogEntry(entry));
  }

  error(message: string, data?: Record<string, unknown>): void {
    const entry: LogContext = {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      data,
    };
    console.error(formatLogEntry(entry));
  }
}

/**
 * Global logger for non-request contexts
 */
export const globalLogger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    console.log(
      formatLogEntry({
        requestId: "system",
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        data,
      })
    );
  },
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(
      formatLogEntry({
        requestId: "system",
        timestamp: new Date().toISOString(),
        level: "info",
        message,
        data,
      })
    );
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(
      formatLogEntry({
        requestId: "system",
        timestamp: new Date().toISOString(),
        level: "warn",
        message,
        data,
      })
    );
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(
      formatLogEntry({
        requestId: "system",
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        data,
      })
    );
  },
};
