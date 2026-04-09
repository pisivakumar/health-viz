/**
 * In-memory report store.
 *
 * In production, swap this for Redis, DynamoDB, or Postgres.
 * The interface stays the same — only the implementation changes.
 */

import type { HealthReport } from "./types";

const MAX_REPORTS = 500;

export interface StoredReport {
  id: string;
  report: HealthReport;
  createdAt: number;
}

// Simple in-memory store (clears on server restart)
const store = new Map<string, StoredReport>();

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );
}

export function saveReport(report: HealthReport): StoredReport {
  if (store.size >= MAX_REPORTS) {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, value] of store) {
      if (value.createdAt < oldestTime) {
        oldestTime = value.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) store.delete(oldestKey);
  }

  const id = generateId();
  const entry: StoredReport = { id, report, createdAt: Date.now() };
  store.set(id, entry);
  return entry;
}

export function getReport(id: string): StoredReport | null {
  return store.get(id) || null;
}

