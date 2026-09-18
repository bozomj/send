import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});

// middleware para barrar múltiplas requisições

const limiter = (key: string) => {
  return async (req: any, res: any, next: any) => {
    const forwardedFor = req.headers["x-forwarded-for"];

    const ip =
      req.headers["cf-connecting-ip"] ||
      (forwardedFor
        ? forwardedFor.split(",")[0].trim()
        : req.socket.remoteAddress || "unknown");

    const { success } = await ratelimit.limit(`${key}:${ip}`);

    if (!success) {
      return res.status(429).json({
        message: "Muitos Downloads requisitados. Tente novamente mais tarde.",
      });
    }

    return next();
  };
};

export default limiter;
