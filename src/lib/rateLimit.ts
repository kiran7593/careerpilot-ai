import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = options.windowMs;

  const key = createHash("sha256")
    .update(`${endpoint}:${identifier}`)
    .digest("hex");

  const expiresAt = new Date(now.getTime() + windowMs);

  const buckets = await prisma.$queryRaw<
    { count: number; expiresAt: Date }[]
  >`
    INSERT INTO "RateLimitBucket" (
      "key",
      "count",
      "windowStartedAt",
      "expiresAt"
    )
    VALUES (
      ${key},
      1,
      ${now},
      ${expiresAt}
    )
    ON CONFLICT ("key")
    DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now}
          THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now}
          THEN ${now}
        ELSE "RateLimitBucket"."windowStartedAt"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now}
          THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING "count", "expiresAt"
  `;

  const bucket = buckets[0];

  if (!bucket) {
    throw new Error("Rate limit bucket could not be created.");
  }

  const remaining = Math.max(options.limit - bucket.count, 0);

  return {
    allowed: bucket.count <= options.limit,
    remaining,
    retryAfterSeconds: Math.max(
      Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000),
      0
    ),
  };
}
