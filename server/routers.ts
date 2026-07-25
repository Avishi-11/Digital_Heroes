import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { performAudit, generateRequestId } from "./audit.service";
import { getCacheKey, auditCache, rateLimiter } from "./cache.service";
import { Logger } from "./logger";
import { createAudit, getUserAudits } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  audit: router({
    performAudit: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "url" in val) {
          return { url: (val as Record<string, unknown>).url as string };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input, ctx }) => {
        const logger = new Logger(ctx.requestId);
        const clientIp = (((ctx.req.headers["x-forwarded-for"] as string) || ctx.req.socket?.remoteAddress) || "unknown").split(",")[0];

        // Check rate limit
        if (!rateLimiter.isAllowed(clientIp)) {
          logger.warn("Rate limit exceeded", { clientIp });
          ctx.res.setHeader("Retry-After", "60");
          throw new Error("Rate limit exceeded. Max 100 requests per minute.");
        }

        // Check cache
        const cacheKey = getCacheKey(input.url);
        const cached = auditCache.get(cacheKey);
        if (cached) {
          logger.info("Cache hit", { url: input.url });
          ctx.res.setHeader("X-Cache", "HIT");
          return { ...cached, requestId: ctx.requestId, cachedAt: new Date() };
        }

        // Perform audit
        logger.info("Starting audit", { url: input.url });
        const result = await performAudit(input.url, ctx.requestId);

        // Cache successful results
        if (!result.error) {
          auditCache.set(cacheKey, result);
          logger.info("Audit cached", { url: input.url });
        }

        // Save to database if user is authenticated
        if (ctx.user) {
          try {
            await createAudit({
              userId: ctx.user.id,
              url: input.url,
              statusCode: result.statusCode,
              responseTime: result.responseTime,
              contentType: result.contentType,
              contentLength: result.contentLength,
              title: result.title,
              metaDescription: result.metaDescription,
              redirectChain: JSON.stringify(result.redirectChain),
              error: result.error,
              headers: result.headers ? JSON.stringify(result.headers) : null,
            });
            logger.info("Audit saved to database", { url: input.url });
          } catch (error) {
            logger.error("Failed to save audit to database", {
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        ctx.res.setHeader("X-Cache", "MISS");
        return result;
      }),

    getHistory: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null) {
          const obj = val as Record<string, unknown>;
          return {
            limit: typeof obj.limit === "number" ? obj.limit : 50,
            offset: typeof obj.offset === "number" ? obj.offset : 0,
          };
        }
        return { limit: 50, offset: 0 };
      })
      .query(async ({ input, ctx }) => {
        const audits = await getUserAudits(ctx.user.id, input.limit, input.offset);
        return audits.map((audit) => ({
          ...audit,
          redirectChain: audit.redirectChain ? JSON.parse(audit.redirectChain) : [],
          headers: audit.headers ? JSON.parse(audit.headers) : {},
        }));
      }),

    getCacheStats: publicProcedure.query(() => {
      return auditCache.getStats();
    }),

    getRateLimiterStats: publicProcedure.query(() => {
      return rateLimiter.getStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
