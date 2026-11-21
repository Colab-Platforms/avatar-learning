"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_ROOT } from "@/lib/adoptionSession";
import { fetchSessions, fetchStats } from "@/lib/monitoringApi";
import { backoffMs, parseSse, type Snapshot } from "@/lib/monitoringLogic";

export type StreamState = "connecting" | "live" | "polling" | "error";

const token = (): string | null => {
  try {
    return (JSON.parse(localStorage.getItem("auth") ?? "null") as { accessToken?: string } | null)?.accessToken ?? null;
  } catch {
    return null;
  }
};

/**
 * Live dashboard data. Reads the server's event stream (Server-Sent Events, through fetch so the normal Authorization header can be
 * sent). If the stream cannot be kept open (proxy, network, expired token) it falls back to polling every 10 seconds and keeps
 * trying to reconnect with back-off, so the page keeps updating without a reload either way.
 */
export function useLiveStream(enabled = true) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [state, setState] = useState<StreamState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const tick = useRef<() => Promise<void>>(async () => {});

  const poll = useCallback(async () => {
    try {
      const [stats, live] = await Promise.all([fetchStats(), fetchSessions({ status: "online", pageSize: 25 })]);
      setSnapshot({ stats, live: live.items, total: live.total });
      setUpdatedAt(Date.now());
      setError(null);
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(status === 403 ? "You do not have access to Live Monitoring." : "Live data is temporarily unavailable.");
      setState("error");
    }
  }, []);
  tick.current = poll;

  useEffect(() => {
    if (!enabled) return;
    const ctl = new AbortController();
    let attempts = 0;
    let retry: number | undefined;
    let stopped = false;

    const startPolling = () => {
      if (pollRef.current !== null) return;
      void tick.current();
      pollRef.current = window.setInterval(() => void tick.current(), 10_000);
    };
    const stopPolling = () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const connect = async () => {
      if (stopped) return;
      try {
        const t = token();
        const res = await fetch(`${API_ROOT}/business-admin/monitoring/stream`, { headers: { Accept: "text/event-stream", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, signal: ctl.signal });
        if (res.status === 403) {
          setError("You do not have access to Live Monitoring.");
          setState("error");
          return;
        }
        if (!res.ok || !res.body) throw new Error("stream unavailable");
        attempts = 0;
        stopPolling();
        setState("live");
        setError(null);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const { events, rest } = parseSse(buf);
          buf = rest;
          for (const ev of events) {
            if (ev.event === "snapshot") {
              try {
                setSnapshot(JSON.parse(ev.data) as Snapshot);
                setUpdatedAt(Date.now());
              } catch {
                /* a malformed message is skipped */
              }
            }
          }
        }
        throw new Error("stream closed");
      } catch {
        if (stopped || ctl.signal.aborted) return;
        setState("polling");
        startPolling(); // also refreshes an expired token through the normal API client
        attempts += 1;
        retry = window.setTimeout(() => void connect(), backoffMs(attempts));
      }
    };
    void connect();
    return () => {
      stopped = true;
      ctl.abort();
      stopPolling();
      if (retry) window.clearTimeout(retry);
    };
  }, [enabled]);

  return { snapshot, state, error, updatedAt, refresh: poll };
}
