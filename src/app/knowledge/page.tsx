"use client";

/**
 * Knowledge Base Admin — View and edit agent knowledge files.
 *
 * Layout: Sidebar (file list) + Main (editor with live preview)
 * No auth — internal tool for business teams.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface KnowledgeFile {
  path: string;
  category: string;
  name: string;
  size: number;
}

export default function KnowledgePage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load file list
  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load file content
  const loadFile = useCallback(async (path: string) => {
    setSelectedFile(path);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/knowledge/${path}`);
      const data = await res.json();
      setContent(data.content || "");
      setOriginalContent(data.content || "");
    } catch {
      setContent("Error loading file");
    }
  }, []);

  // Save file
  const saveFile = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/knowledge/${selectedFile}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setOriginalContent(content);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [selectedFile, content]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [saveFile]);

  const hasChanges = content !== originalContent;
  const traitFiles = files.filter((f) => f.category === "traits");
  const playbookFiles = files.filter((f) => f.category === "playbooks");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-black/[0.06] bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="tenx-heading text-lg tracking-tight">
              10<span className="tenx-brand-x">X</span> HEALTH
            </a>
            <span className="text-muted-foreground text-xs">/</span>
            <h1 className="tenx-heading text-sm tracking-wide">KNOWLEDGE BASE</h1>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "success" && (
              <span className="text-xs text-green-600 font-medium">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-tenx-red font-medium">Save failed</span>
            )}
            {selectedFile && (
              <button
                onClick={saveFile}
                disabled={saving || !hasChanges}
                className={`text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-[10px] transition-opacity ${
                  hasChanges
                    ? "bg-tenx-red text-white hover:opacity-90"
                    : "bg-black/[0.06] text-muted-foreground cursor-not-allowed"
                }`}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-black/[0.06] p-4 space-y-5 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading files...</p>
          ) : (
            <>
              <FileGroup
                title="Playbooks"
                files={playbookFiles}
                selectedFile={selectedFile}
                onSelect={loadFile}
              />
              <FileGroup
                title="Traits"
                files={traitFiles}
                selectedFile={selectedFile}
                onSelect={loadFile}
              />
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="px-6 py-3 border-b border-black/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={selectedFile.split("/")[0]} />
                  <span className="text-sm font-semibold text-foreground">
                    {selectedFile.split("/").pop()?.replace(".md", "")}
                  </span>
                  {hasChanges && (
                    <span className="w-2 h-2 rounded-full bg-tenx-red" title="Unsaved changes" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {selectedFile}
                </span>
              </div>

              {/* Editor + Preview split */}
              <div className="flex flex-1 min-h-0">
                {/* Editor */}
                <div className="flex-1 flex flex-col border-r border-black/[0.06]">
                  <div className="px-4 py-2 bg-black/[0.02] border-b border-black/[0.04]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Markdown Source
                    </span>
                  </div>
                  <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 p-4 bg-transparent resize-none outline-none text-sm font-mono leading-relaxed text-foreground"
                    spellCheck={false}
                  />
                </div>

                {/* Preview */}
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 bg-black/[0.02] border-b border-black/[0.04]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Preview
                    </span>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <MarkdownPreview content={content} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-4xl">📚</div>
                <h2 className="tenx-heading text-lg">KNOWLEDGE BASE</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a file from the sidebar to view and edit the Health Agent's
                  knowledge base. Changes take effect immediately.
                </p>
                <div className="flex justify-center gap-4 pt-2">
                  <div className="text-center">
                    <div className="tenx-heading text-2xl text-tenx-red">{playbookFiles.length}</div>
                    <p className="text-[10px] text-muted-foreground uppercase">Playbooks</p>
                  </div>
                  <div className="text-center">
                    <div className="tenx-heading text-2xl text-green-600">{traitFiles.length}</div>
                    <p className="text-[10px] text-muted-foreground uppercase">Traits</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── File Group ──

function FileGroup({
  title,
  files,
  selectedFile,
  onSelect,
}: {
  title: string;
  files: KnowledgeFile[];
  selectedFile: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
        {title}
      </p>
      <div className="space-y-0.5">
        {files.map((f) => {
          const isSelected = selectedFile === f.path;
          return (
            <button
              key={f.path}
              onClick={() => onSelect(f.path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                isSelected
                  ? "bg-tenx-red/10 text-tenx-red font-medium"
                  : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
              }`}
            >
              <span className="text-base">{f.category === "playbooks" ? "📋" : "🧬"}</span>
              <span className="truncate">{f.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Category Badge ──

function CategoryBadge({ category }: { category: string }) {
  const isPlaybook = category === "playbooks";
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
        isPlaybook ? "bg-tenx-red/10 text-tenx-red" : "bg-green-500/10 text-green-700"
      }`}
    >
      {isPlaybook ? "Playbook" : "Trait"}
    </span>
  );
}

// ── Markdown Preview (lightweight, no dependencies) ──

function MarkdownPreview({ content }: { content: string }) {
  const html = markdownToHtml(content);
  return (
    <div
      className="prose prose-sm max-w-none
        prose-headings:font-heading prose-headings:uppercase prose-headings:tracking-wide
        prose-h1:text-lg prose-h1:border-b prose-h1:border-black/[0.06] prose-h1:pb-2
        prose-h2:text-base prose-h2:text-tenx-red
        prose-h3:text-sm
        prose-strong:text-foreground
        prose-code:bg-black/[0.04] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-li:text-muted-foreground
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-hr:border-black/[0.06]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Simple markdown → HTML converter. Handles the patterns used in our knowledge files:
 * headings, bold, italic, lists, code, horizontal rules, blockquotes, links.
 */
function markdownToHtml(md: string): string {
  // Remove frontmatter
  const cleaned = md.replace(/^---\n[\s\S]*?\n---\n/, "");

  return cleaned
    .split("\n")
    .map((line) => {
      // Headings
      if (line.startsWith("### ")) return `<h3>${inline(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${inline(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${inline(line.slice(2))}</h1>`;

      // Horizontal rule
      if (/^---+$/.test(line.trim())) return "<hr />";

      // Blockquote
      if (line.startsWith("> ")) return `<blockquote><p>${inline(line.slice(2))}</p></blockquote>`;

      // Unordered list
      if (/^[-*] /.test(line.trim())) return `<li>${inline(line.replace(/^\s*[-*] /, ""))}</li>`;

      // Ordered list
      if (/^\d+\. /.test(line.trim())) return `<li>${inline(line.replace(/^\s*\d+\. /, ""))}</li>`;

      // Empty line
      if (line.trim() === "") return "<br />";

      // Paragraph
      return `<p>${inline(line)}</p>`;
    })
    .join("\n")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
}

/** Inline markdown: bold, italic, code, links */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-tenx-red underline">$1</a>');
}
