/**
 * Knowledge Loader — reads markdown knowledge files from disk on demand.
 *
 * Server-side only (uses fs). Called from API routes via agent.ts.
 * Caches loaded content in memory to avoid repeated disk reads.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const KNOWLEDGE_DIR = join(process.cwd(), "src/lib/health-agent/knowledge");

// ── Cache ──

const cache = new Map<string, string>();

function readFile(relativePath: string): string {
  const cacheKey = relativePath;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const fullPath = join(KNOWLEDGE_DIR, relativePath);
  try {
    const content = readFileSync(fullPath, "utf-8");
    cache.set(cacheKey, content);
    return content;
  } catch (err) {
    console.warn(`[knowledge-loader] Could not read ${fullPath}:`, err);
    return "";
  }
}

// ── Trait Loading ──

export interface TraitMeta {
  id: string;
  label: string;
  source_biomarkers: string[];
  inverted: boolean;
  explanation: string;
  fullContent: string;
}

/**
 * Parse frontmatter from a markdown file.
 * Returns { meta: Record<string, string>, body: string }
 */
function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const metaLines = match[1].split("\n");
  const meta: Record<string, string> = {};
  for (const line of metaLines) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      meta[key] = val;
    }
  }
  return { meta, body: match[2].trim() };
}

/**
 * Load a single trait file by id (e.g., "caffeine-sensitivity").
 */
export function loadTrait(filename: string): TraitMeta {
  const content = readFile(`traits/${filename}.md`);
  const { meta, body } = parseFrontmatter(content);

  // Extract the first paragraph after the # heading as explanation
  const explanationMatch = body.match(/^# .+\n\n(.+?)(\n\n|$)/);
  const explanation = explanationMatch?.[1] || "";

  // Parse source_biomarkers from frontmatter (YAML array format)
  const biomarkersStr = meta.source_biomarkers || "[]";
  const biomarkers = biomarkersStr.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);

  return {
    id: meta.id || filename,
    label: meta.label || filename,
    source_biomarkers: biomarkers,
    inverted: meta.inverted === "true",
    explanation,
    fullContent: body,
  };
}

/**
 * Load all trait files.
 */
export function loadAllTraits(): TraitMeta[] {
  try {
    const files = readdirSync(join(KNOWLEDGE_DIR, "traits")).filter((f) => f.endsWith(".md"));
    return files.map((f) => loadTrait(f.replace(".md", "")));
  } catch {
    console.warn("[knowledge-loader] Could not read traits directory");
    return [];
  }
}

// ── Playbook Loading ──

/**
 * Load a playbook by name (e.g., "compliance", "cause-effects").
 * Returns the raw markdown content.
 */
export function loadPlaybook(name: string): string {
  return readFile(`playbooks/${name}.md`);
}

/**
 * Load multiple playbooks, concatenated with headers.
 */
export function loadPlaybooks(names: string[]): string {
  return names
    .map((name) => {
      const content = loadPlaybook(name);
      return content ? content : "";
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

// ── Config Loading ──

let configCache: Record<string, unknown> | null = null;

/**
 * Load config.json (metric formulas, trait-to-metric mappings).
 */
export function loadConfig(): Record<string, unknown> {
  if (configCache) return configCache;
  try {
    const content = readFileSync(join(KNOWLEDGE_DIR, "config.json"), "utf-8");
    configCache = JSON.parse(content);
    return configCache!;
  } catch {
    console.warn("[knowledge-loader] Could not read config.json");
    return {};
  }
}

/**
 * Get trait-to-metric numeric values from config.
 */
export function getTraitMetricValues(): Record<string, number> {
  const config = loadConfig();
  return (config.trait_to_metric_value as Record<string, number>) || {};
}

/**
 * Write content to a knowledge file and clear cache.
 */
export function writeKnowledgeFile(relativePath: string, content: string): void {
  const fullPath = join(KNOWLEDGE_DIR, relativePath);
  const { writeFileSync } = require("fs") as typeof import("fs");
  writeFileSync(fullPath, content, "utf-8");
  cache.delete(relativePath);
}

/**
 * List all knowledge files with metadata.
 */
export function listKnowledgeFiles(): { path: string; category: string; name: string; size: number }[] {
  const { statSync } = require("fs") as typeof import("fs");
  const results: { path: string; category: string; name: string; size: number }[] = [];

  for (const category of ["traits", "playbooks"]) {
    try {
      const dir = join(KNOWLEDGE_DIR, category);
      const files = readdirSync(dir).filter(f => f.endsWith(".md"));
      for (const file of files) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        results.push({
          path: `${category}/${file}`,
          category,
          name: file.replace(".md", ""),
          size: stat.size,
        });
      }
    } catch {
      // directory doesn't exist, skip
    }
  }

  return results;
}

/**
 * Clear the cache (useful for development/hot-reload).
 */
export function clearCache(): void {
  cache.clear();
  configCache = null;
}
