// Minimal client-side helpers.
// Keep this file small and dependency-light for static hosting.

let mermaidLoadPromise = null;
let activeMermaidModal = null;

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

// Ensure external links open in a new tab.
document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.querySelectorAll("a[href^='http']")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  void renderMermaidIfPresent();
});
