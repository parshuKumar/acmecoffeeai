// public/widget.js — the loader script clients paste onto their site:
//   <script src="https://yourapp/widget.js" data-bot-id="acme-coffee"></script>
//
// Plain vanilla JS, no build step, no dependencies. This runs directly inside
// someone else's website, alongside code we don't control, so it must never
// crash the host page and must never leak styles in either direction. Actual
// isolation of the chat UI comes from the <iframe> itself (see
// docs/01-architecture-overview.md) — this file's own job is just to draw a
// small floating bubble and toggle that iframe, using only inline styles and
// an extreme z-index so it can't collide with the host page's CSS.
//
// Must be a <script src="..."> tag written directly in the page's HTML (the
// browser's parser inserts it), not one injected dynamically at runtime via
// document.createElement()/appendChild() — that's what guarantees
// document.currentScript below refers to this tag. `async`/`defer` are both
// fine on a parser-inserted tag like this; currentScript tracking depends on
// how the tag got into the page, not on those attributes.
(function () {
  "use strict";

  if (window.__acmeChatWidgetLoaded) return; // guard against the tag being pasted twice
  window.__acmeChatWidgetLoaded = true;

  try {
    var scriptEl = document.currentScript;
    if (!scriptEl) {
      console.error(
        "[chat-widget] document.currentScript is unavailable — make sure the widget <script> tag is written directly in the page's HTML, not injected dynamically via JS. Skipping."
      );
      return;
    }

    var botId = scriptEl.getAttribute("data-bot-id");
    if (!botId) {
      console.error(
        "[chat-widget] Missing required data-bot-id attribute on the widget <script> tag. Skipping."
      );
      return;
    }

    // Derive our own app's origin from wherever THIS script was actually
    // loaded from, instead of a hardcoded domain. That's what makes this one
    // file work unmodified from localhost, a staging domain, or production.
    var origin;
    try {
      origin = new URL(scriptEl.src).origin;
    } catch (err) {
      console.error("[chat-widget] Could not determine the widget's own origin from its <script src>. Skipping.", err);
      return;
    }

    var prefersReducedMotion =
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    var MOBILE_BREAKPOINT = 480;
    var DESKTOP_WIDTH = 380;
    var DESKTOP_HEIGHT = 560;
    var MARGIN = 20;
    var MAX_Z_INDEX = 2147483647;

    var isOpen = false;
    var iframe = null;

    var container = document.createElement("div");
    container.setAttribute("data-acme-chat-widget", "container");
    // Inline styles only, on purpose — never a linked stylesheet or class
    // name, so nothing here can collide with the host page's own CSS rules.
    container.style.position = "fixed";
    container.style.right = MARGIN + "px";
    container.style.bottom = MARGIN + "px";
    container.style.zIndex = String(MAX_Z_INDEX);
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-end";
    container.style.gap = "12px";
    container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    var bubble = document.createElement("button");
    bubble.type = "button";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.style.width = "56px";
    bubble.style.height = "56px";
    bubble.style.borderRadius = "9999px";
    bubble.style.border = "none";
    bubble.style.cursor = "pointer";
    bubble.style.backgroundColor = "#2B1B12";
    bubble.style.color = "#FBF3E7";
    bubble.style.fontSize = "24px";
    bubble.style.lineHeight = "56px";
    bubble.style.textAlign = "center";
    bubble.style.padding = "0";
    bubble.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    bubble.textContent = "💬";

    function isMobileViewport() {
      return window.innerWidth <= MOBILE_BREAKPOINT || window.innerHeight <= 480;
    }

    function sizeIframe() {
      if (!iframe) return;
      if (isMobileViewport()) {
        iframe.style.position = "fixed";
        iframe.style.inset = "0";
        iframe.style.right = "";
        iframe.style.bottom = "";
        iframe.style.width = "100vw";
        iframe.style.height = "100dvh";
        iframe.style.borderRadius = "0";
      } else {
        iframe.style.position = "static";
        iframe.style.inset = "";
        iframe.style.width = DESKTOP_WIDTH + "px";
        iframe.style.height = DESKTOP_HEIGHT + "px";
        iframe.style.borderRadius = "16px";
      }
    }

    function ensureIframe() {
      if (iframe) return iframe;
      iframe = document.createElement("iframe");
      iframe.title = "Chat widget";
      iframe.src = origin + "/embed?botId=" + encodeURIComponent(botId);
      iframe.style.border = "none";
      iframe.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
      iframe.style.display = "none";
      iframe.style.opacity = prefersReducedMotion ? "1" : "0";
      iframe.style.transform = prefersReducedMotion ? "none" : "translateY(12px)";
      iframe.style.transition = prefersReducedMotion ? "none" : "opacity 160ms ease, transform 160ms ease";
      sizeIframe();
      container.insertBefore(iframe, bubble);
      return iframe;
    }

    function openWidget() {
      var el = ensureIframe();
      sizeIframe();
      el.style.display = "block";
      void el.offsetHeight; // force a reflow so the transition below actually plays
      el.style.opacity = "1";
      el.style.transform = "none";
      isOpen = true;
      bubble.setAttribute("aria-label", "Close chat");
      bubble.textContent = "✕";
    }

    function closeWidget() {
      // Hide instantly rather than animate-then-hide — keeps the close path
      // simple, and the iframe (and its conversation) stays alive underneath
      // so reopening picks the conversation back up instead of resetting it.
      if (iframe) iframe.style.display = "none";
      isOpen = false;
      bubble.setAttribute("aria-label", "Open chat");
      bubble.textContent = "💬";
    }

    bubble.addEventListener("click", function () {
      if (isOpen) closeWidget();
      else openWidget();
    });

    window.addEventListener("resize", function () {
      if (isOpen) sizeIframe();
    });

    container.appendChild(bubble);

    function mount() {
      if (document.body) {
        document.body.appendChild(container);
      } else {
        document.addEventListener("DOMContentLoaded", function () {
          document.body.appendChild(container);
        });
      }
    }

    mount();
  } catch (err) {
    // Whatever went wrong, the host page must be unaffected — the widget
    // simply won't appear.
    console.error("[chat-widget] Unexpected error while initializing; the widget will not appear.", err);
  }
})();
