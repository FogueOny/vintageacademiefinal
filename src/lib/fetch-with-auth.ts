"use client";

import { ensureValidSession, forceReauth } from "@/lib/supabase/client";

export interface FetchWithAuthOptions extends RequestInit {
  timeoutMs?: number;
  redirectOnFail?: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout ${label} after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

async function doFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: FetchWithAuthOptions,
): Promise<Response> {
  const { timeoutMs, redirectOnFail = true, ...rest } = init ?? {};

  const exec = () => doFetch(input, rest);
  const run = timeoutMs ? () => withTimeout(exec(), timeoutMs, "fetchWithAuth") : exec;

  let res: Response;
  try {
    res = await run();
  } catch {
    await ensureValidSession();
    res = await run();
  }

  if (res.status !== 401) {
    return res;
  }

  const sessionRes = await ensureValidSession();
  if (!sessionRes.valid) {
    if (redirectOnFail) {
      forceReauth();
    }
    return res;
  }

  const retryRes = await run();
  if (retryRes.status === 401 && redirectOnFail) {
    forceReauth();
  }

  return retryRes;
}

type HttpError = Error & {
  status: number;
  payload?: unknown;
};

export async function fetchJsonWithAuth<T = unknown>(
  input: RequestInfo | URL,
  init?: FetchWithAuthOptions,
): Promise<T> {
  const res = await fetchWithAuth(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      // ignore parsing errors, fallback to generic message
    }

    let message = `HTTP ${res.status}`;
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
    ) {
      message = (payload as { error: string }).error;
    }

    const err: HttpError = new Error(message) as HttpError;
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return (await res.json()) as T;
}
