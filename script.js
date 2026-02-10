// Minimal client-side helpers.
// Keep this file small and dependency-light for static hosting.

let mermaidLoadPromise = null;
let activeMermaidModal = null;

const LANGUAGE_LABELS = {
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Shell",
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  toml: "TOML",
  ini: "INI",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  html: "HTML",
  css: "CSS",
  python: "Python",
  py: "Python",
  go: "Go",
  rust: "Rust",
  rs: "Rust",
  diff: "Diff",
  patch: "Diff",
};

function formatLanguageLabel(lang) {
  const normalized = (lang || "").toLowerCase().trim();
  if (!normalized) return "";
  if (LANGUAGE_LABELS[normalized]) return LANGUAGE_LABELS[normalized];
  return normalized
    .replace(/^language-/, "")
    .replace(/^lang-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectLanguageClass(pre, code) {
  const classes = [];
  if (code && code.classList) classes.push(...code.classList);
  if (pre && pre.classList) classes.push(...pre.classList);

  for (const cls of classes) {
    if (cls.startsWith("language-")) return cls.slice("language-".length);
    if (cls.startsWith("lang-")) return cls.slice("lang-".length);
  }

  // Pandoc: "sourceCode <lang>"
  const pandocLang = classes.find((cls) => cls && cls !== "sourceCode" && cls !== "text");
  return pandocLang || "";
}

function isMermaidCodeBlock(pre, code) {
  if (pre && pre.classList && pre.classList.contains("mermaid")) return true;
  if (!code || !code.classList) return false;
  return code.classList.contains("language-mermaid") || code.classList.contains("mermaid");
}

function normalizeTrailingNewline(text) {
  if (!text) return "";
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}

function addCopyButton(container, code) {
  if (!container || !code) return;
  if (container.querySelector(":scope > button.code-copy")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-copy";
  button.textContent = "Copy";
  button.setAttribute("aria-label", "Copy code to clipboard");

  const setStatus = (label) => {
    button.textContent = label;
    window.clearTimeout(button.__resetTimer);
    button.__resetTimer = window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1400);
  };

  button.addEventListener("click", async () => {
    const raw = normalizeTrailingNewline(code.textContent || "");
    if (!raw) return;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(raw);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = raw;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setStatus("Copied");
    } catch {
      setStatus("Failed");
    }
  });

  container.appendChild(button);
}

function enhanceCodeBlocks() {
  // Pandoc blocks: <div class="sourceCode"><pre class="sourceCode ..."><code class="sourceCode ...">...</code></pre></div>
  for (const container of document.querySelectorAll("div.sourceCode")) {
    const pre = container.querySelector(":scope > pre");
    const code = container.querySelector(":scope > pre > code");
    if (!pre || !code) continue;
    if (isMermaidCodeBlock(pre, code)) continue;

    container.classList.add("codeblock");
    const lang = formatLanguageLabel(detectLanguageClass(pre, code));
    if (lang) container.dataset.lang = lang;
    addCopyButton(container, code);
  }

  // Other fenced code blocks: <pre><code class="language-...">...</code></pre>
  for (const pre of document.querySelectorAll("pre")) {
    if (pre.closest("div.sourceCode")) continue;
    const code = pre.querySelector(":scope > code");
    if (!code) continue;
    if (isMermaidCodeBlock(pre, code)) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "codeblock";

    const lang = formatLanguageLabel(detectLanguageClass(pre, code));
    if (lang) wrapper.dataset.lang = lang;

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    addCopyButton(wrapper, code);
  }
}

function normalizeMermaidBlocks() {
  // Pandoc: <pre class="mermaid"><code>...</code></pre>
  for (const pre of document.querySelectorAll("pre.mermaid")) {
    const code = pre.querySelector(":scope > code");
    if (code) {
      pre.textContent = code.textContent || "";
    }
  }

  // python-markdown: <pre><code class="language-mermaid">...</code></pre>
  for (const code of document.querySelectorAll("pre > code.language-mermaid, pre > code.mermaid")) {
    const pre = code.parentElement;
    if (!pre) continue;
    pre.classList.add("mermaid");
    pre.textContent = code.textContent || "";
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function loadMermaid() {
  if (window.mermaid) return Promise.resolve();
  if (mermaidLoadPromise) return mermaidLoadPromise;

  mermaidLoadPromise = (async () => {
    try {
      await loadScript("mermaid.min.js");
      return;
    } catch {
      // Fall back to CDN for local previewing if the asset isn't present.
      await loadScript("https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js");
    }
  })();

  return mermaidLoadPromise;
}

function closeMermaidModal() {
  if (!activeMermaidModal) return;

  const { modal, onKeyDown, previousOverflow, previousActiveElement } = activeMermaidModal;
  activeMermaidModal = null;

  document.removeEventListener("keydown", onKeyDown);
  document.body.style.overflow = previousOverflow;
  modal.remove();

  if (previousActiveElement && typeof previousActiveElement.focus === "function") {
    previousActiveElement.focus();
  }
}

function openMermaidModalFromBlock(block) {
  const svg = block.querySelector("svg");
  if (!svg) return;

  closeMermaidModal();

  const previousActiveElement = document.activeElement;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const modal = document.createElement("div");
  modal.className = "mermaid-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const panel = document.createElement("div");
  panel.className = "mermaid-modal__panel";

  const toolbar = document.createElement("div");
  toolbar.className = "mermaid-modal__toolbar";

  const zoomOutButton = document.createElement("button");
  zoomOutButton.type = "button";
  zoomOutButton.textContent = "−";
  zoomOutButton.setAttribute("aria-label", "Zoom out");

  const zoomInButton = document.createElement("button");
  zoomInButton.type = "button";
  zoomInButton.textContent = "+";
  zoomInButton.setAttribute("aria-label", "Zoom in");

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset";

  const spacer = document.createElement("span");
  spacer.className = "spacer";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";

  toolbar.append(zoomOutButton, zoomInButton, resetButton, spacer, closeButton);

  const viewport = document.createElement("div");
  viewport.className = "mermaid-modal__viewport";

  const svgClone = svg.cloneNode(true);
  if (svgClone instanceof SVGElement) {
    svgClone.style.width = "100%";
    svgClone.style.height = "auto";
    svgClone.style.maxWidth = "none";
  }
  viewport.appendChild(svgClone);

  panel.append(toolbar, viewport);
  modal.appendChild(panel);
  document.body.appendChild(modal);

  let scale = 1;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const applyScale = () => {
    const pct = Math.round(scale * 100);
    if (svgClone instanceof SVGElement) {
      svgClone.style.width = `${pct}%`;
    }
  };

  zoomInButton.addEventListener("click", () => {
    scale = clamp(scale * 1.25, 0.6, 3);
    applyScale();
  });
  zoomOutButton.addEventListener("click", () => {
    scale = clamp(scale / 1.25, 0.6, 3);
    applyScale();
  });
  resetButton.addEventListener("click", () => {
    scale = 1;
    applyScale();
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  });
  closeButton.addEventListener("click", closeMermaidModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeMermaidModal();
  });

  const onKeyDown = (event) => {
    if (event.key === "Escape") closeMermaidModal();
    if ((event.key === "+" || event.key === "=") && (event.metaKey || event.ctrlKey)) {
      // Let the browser zoom handle cmd/ctrl + '+'.
      return;
    }
    if (event.key === "+" || event.key === "=") {
      scale = clamp(scale * 1.25, 0.6, 3);
      applyScale();
    }
    if (event.key === "-" || event.key === "_") {
      scale = clamp(scale / 1.25, 0.6, 3);
      applyScale();
    }
  };
  document.addEventListener("keydown", onKeyDown);

  activeMermaidModal = { modal, onKeyDown, previousOverflow, previousActiveElement };
  closeButton.focus();
}

function enableMermaidZoom() {
  for (const block of document.querySelectorAll("pre.mermaid")) {
    if (block.dataset.mermaidZoomReady === "1") continue;
    if (!block.querySelector("svg")) continue;

    block.dataset.mermaidZoomReady = "1";
    block.tabIndex = 0;
    block.setAttribute("role", "button");
    block.setAttribute("aria-label", "Open diagram");

    const open = () => openMermaidModalFromBlock(block);
    block.addEventListener("click", open);
    block.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }
}

async function renderMermaidIfPresent() {
  if (!document.querySelector(".mermaid, pre > code.language-mermaid, pre > code.mermaid")) {
    return;
  }

  normalizeMermaidBlocks();

  try {
    await loadMermaid();
  } catch {
    return;
  }

  const mermaid = window.mermaid;
  if (!mermaid) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
    flowchart: {
      useMaxWidth: false,
      htmlLabels: true,
    },
  });

  if (typeof mermaid.run === "function") {
    try {
      await mermaid.run({ querySelector: ".mermaid" });
    } catch {
      // Keep the original code block visible on failure.
    }
    enableMermaidZoom();
    return;
  }

  if (typeof mermaid.init === "function") {
    try {
      mermaid.init(undefined, document.querySelectorAll(".mermaid"));
    } catch {
      // Keep the original code block visible on failure.
    }
    enableMermaidZoom();
  }
}

function setupSharePanels() {
  const panels = document.querySelectorAll(".share-panel");
  if (!panels.length) return;

  const canonicalLink = document.querySelector("link[rel='canonical']");
  const defaultUrl = canonicalLink ? canonicalLink.href : window.location.href;
  const ogTitleEl = document.querySelector("meta[property='og:title']");
  const metaDescriptionEl = document.querySelector("meta[name='description']");
  const defaultTitle = ogTitleEl && ogTitleEl.content ? ogTitleEl.content : document.title;
  const defaultDescription = metaDescriptionEl && metaDescriptionEl.content
    ? metaDescriptionEl.content
    : defaultTitle;

  panels.forEach((panel) => {
    const shareTitle = (panel.dataset.shareTitle || defaultTitle || "").trim();
    const shareUrl = (panel.dataset.shareUrl || defaultUrl || "").trim();
    const shareText = (panel.dataset.shareText || defaultDescription || shareTitle).trim();
    const statusEl = panel.querySelector(".share-status");
    let statusTimeout = null;

    const updateStatus = (message) => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.add("is-visible");
      if (statusTimeout) window.clearTimeout(statusTimeout);
      statusTimeout = window.setTimeout(() => {
        statusEl.textContent = "";
        statusEl.classList.remove("is-visible");
      }, 2200);
    };

    const copyToClipboard = async (message = "Link copied.") => {
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        }
      } catch {
        copied = false;
      }

      if (!copied) {
        const tempInput = document.createElement("textarea");
        tempInput.value = shareUrl;
        tempInput.setAttribute("readonly", "");
        tempInput.style.position = "absolute";
        tempInput.style.left = "-9999px";
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
          copied = document.execCommand("copy");
        } catch {
          copied = false;
        } finally {
          document.body.removeChild(tempInput);
        }
      }

      updateStatus(copied ? message : "Copy failed. Use the address bar.");
    };

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const emailBody = shareText ? `${shareText}\n\n${shareUrl}` : `${shareTitle}\n${shareUrl}`;
    const encodedBody = encodeURIComponent(emailBody);

    const xLink = panel.querySelector("a[data-share='x']");
    if (xLink) xLink.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

    const fbLink = panel.querySelector("a[data-share='facebook']");
    if (fbLink) fbLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    const linkedinLink = panel.querySelector("a[data-share='linkedin']");
    if (linkedinLink) linkedinLink.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    const redditLink = panel.querySelector("a[data-share='reddit']");
    if (redditLink) redditLink.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;

    const emailLink = panel.querySelector("a[data-share='email']");
    if (emailLink) emailLink.href = `mailto:?subject=${encodedTitle}&body=${encodedBody}`;

    const copyButton = panel.querySelector("button[data-share='copy']");
    if (copyButton) {
      copyButton.addEventListener("click", (event) => {
        event.preventDefault();
        void copyToClipboard();
      });
    }

    const nativeButton = panel.querySelector("button[data-share='native']");
    if (nativeButton) {
      if (!navigator.share) {
        nativeButton.hidden = true;
      } else {
        nativeButton.addEventListener("click", async (event) => {
          event.preventDefault();
          try {
            await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          } catch (err) {
            if (err && err.name !== "AbortError") {
              void copyToClipboard();
            }
          }
        });
      }
    }
  });
}

let searchIndexPromise = null;

function tokenizeQuery(query) {
  return (query || "")
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
    .slice(0, 12);
}

function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) break;
    count += 1;
    idx += needle.length;
  }
  return count;
}

function escapeRegExp(text) {
  return (text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightRegex(tokens) {
  const escaped = (tokens || [])
    .map((t) => escapeRegExp(t))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!escaped.length) return null;
  return new RegExp(`(${escaped.join("|")})`, "ig");
}

function appendHighlightedText(el, text, regex) {
  if (!el) return;
  const raw = text || "";
  if (!regex) {
    el.textContent = raw;
    return;
  }

  let lastIndex = 0;
  for (const match of raw.matchAll(regex)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > lastIndex) {
      el.appendChild(document.createTextNode(raw.slice(lastIndex, start)));
    }
    const mark = document.createElement("mark");
    mark.textContent = raw.slice(start, end);
    el.appendChild(mark);
    lastIndex = end;
  }

  if (lastIndex < raw.length) {
    el.appendChild(document.createTextNode(raw.slice(lastIndex)));
  }
}

function makeSnippet(text, tokens) {
  const raw = (text || "").trim();
  if (!raw) return "";

  const lower = raw.toLowerCase();
  let firstPos = -1;
  for (const token of tokens) {
    const pos = lower.indexOf(token);
    if (pos !== -1 && (firstPos === -1 || pos < firstPos)) firstPos = pos;
  }

  const maxLen = 220;
  if (firstPos === -1) return raw.slice(0, maxLen) + (raw.length > maxLen ? "…" : "");

  const start = Math.max(0, firstPos - 90);
  const end = Math.min(raw.length, firstPos + 160);
  let snippet = raw.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < raw.length) snippet = `${snippet}…`;
  return snippet;
}

async function loadSearchIndex() {
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = (async () => {
    try {
      const res = await fetch("search-index.json", { cache: "force-cache" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !Array.isArray(data.docs)) return null;
      return data;
    } catch {
      return null;
    }
  })();
  return searchIndexPromise;
}

function setupSearchPage() {
  const input = document.getElementById("search-input");
  const form = input ? input.closest("form") : null;
  const resultsEl = document.getElementById("search-results");
  const statusEl = document.getElementById("search-status");
  if (!input || !resultsEl || !statusEl) return;

  const setStatus = (text) => {
    statusEl.textContent = text || "";
  };

  const clearResults = () => {
    resultsEl.innerHTML = "";
  };

  const updateUrl = (query) => {
    const url = new URL(window.location.href);
    const q = (query || "").trim();
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url.toString());
  };

  const renderResults = (items, tokens) => {
    clearResults();
    const regex = buildHighlightRegex(tokens);

    for (const { doc, score } of items) {
      const li = document.createElement("li");
      li.className = "search-result";

      const titleLink = document.createElement("a");
      titleLink.className = "search-result__title";
      titleLink.href = doc.href || "";
      titleLink.textContent = doc.title || doc.href || "Untitled";

      const meta = document.createElement("div");
      meta.className = "search-result__meta";
      meta.textContent = doc.section ? `${doc.section}` : (doc.kind || "Page");

      const snippetText = makeSnippet(doc.text || "", tokens);
      const snippet = document.createElement("div");
      snippet.className = "search-result__snippet";
      appendHighlightedText(snippet, snippetText, regex);

      const debug = document.createElement("div");
      debug.className = "search-result__score";
      debug.textContent = `Score: ${Math.round(score)}`;
      debug.hidden = true;

      li.append(titleLink, meta, snippet, debug);
      resultsEl.appendChild(li);
    }
  };

  const scoreDoc = (doc, tokens) => {
    const title = (doc.title || "").toLowerCase();
    const text = (doc.text || "").toLowerCase();

    let score = 0;
    for (const token of tokens) {
      const inTitle = countOccurrences(title, token);
      const inText = countOccurrences(text, token);
      if (!inTitle && !inText) return 0;
      score += inTitle * 25 + inText * 4;
    }

    if (doc.kind === "chapter") score += 2;
    if (doc.kind === "concepts") score += 1;
    return score;
  };

  let lastQuery = "";
  let debounceTimer = null;

  const runSearch = async (query) => {
    lastQuery = query;
    const tokens = tokenizeQuery(query);
    updateUrl(query);

    if (!tokens.length) {
      clearResults();
      setStatus("Type to search.");
      return;
    }

    setStatus("Searching…");
    const index = await loadSearchIndex();
    if (!index) {
      setStatus("Search index not available.");
      return;
    }

    const docs = index.docs || [];
    const scored = [];
    for (const doc of docs) {
      if (!doc || doc.kind === "search") continue;
      const score = scoreDoc(doc, tokens);
      if (score > 0) scored.push({ doc, score });
    }
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 30);
    renderResults(top, tokens);
    setStatus(`${scored.length} result${scored.length === 1 ? "" : "s"} for “${query.trim()}”.`);
  };

  const onInput = () => {
    const query = input.value || "";
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      void runSearch(query);
    }, 90);
  };

  input.addEventListener("input", onInput);
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void runSearch(input.value || "");
    });
  }

  const initial = new URLSearchParams(window.location.search).get("q") || "";
  if (initial) input.value = initial;
  void runSearch(initial);
}

// Ensure external links open in a new tab.
document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.querySelectorAll("a[href^='http']")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  setupSearchPage();
  setupSharePanels();
  enhanceCodeBlocks();
  void renderMermaidIfPresent();
});
