import type { Request, Response } from "express";
import type { MonitoringService } from "./monitoring.service.js";

/**
 * Server-Sent Events for the Live Monitoring dashboard. One snapshot is computed per tick and shared by every connected admin
 * (so ten admins cost the same as one). The timer runs only while someone is connected. `no-transform` keeps the compression
 * middleware from buffering the stream. The browser reads it with fetch (so it can send the normal Authorization header).
 */
export function createLiveStream(service: MonitoringService, opts: { intervalMs?: number; maxClients?: number } = {}) {
  const intervalMs = opts.intervalMs ?? 5000;
  const maxClients = opts.maxClients ?? 50;
  const clients = new Set<Response>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const snapshot = async () => {
    const [stats, live] = await Promise.all([service.stats(), service.listSessions({ status: "online", pageSize: 25 })]);
    return { stats, live: live.items, total: live.total };
  };
  const send = (res: Response, data: unknown) => res.write(`event: snapshot\ndata: ${JSON.stringify(data)}\n\n`);
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  const tick = async () => {
    if (!clients.size) return stop();
    try {
      const data = await snapshot();
      for (const c of clients) send(c, data);
    } catch {
      for (const c of clients) c.write(`event: error\ndata: {"message":"Live data is temporarily unavailable."}\n\n`);
    }
  };

  const handler = async (req: Request, res: Response) => {
    if (clients.size >= maxClients) return void res.status(503).json({ status: false, data: null, message: "Too many live viewers. Try again shortly." });
    res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.flushHeaders?.();
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => {
      clients.delete(res);
      if (!clients.size) stop();
    });
    try {
      send(res, await snapshot());
    } catch {
      res.write(`event: error\ndata: {"message":"Live data is temporarily unavailable."}\n\n`);
    }
    if (!timer) {
      timer = setInterval(() => void tick(), intervalMs);
      timer.unref?.();
    }
  };
  return Object.assign(handler, {
    clientCount: () => clients.size,
    closeAll: () => {
      for (const c of clients) c.end();
      clients.clear();
      stop();
    },
  });
}
