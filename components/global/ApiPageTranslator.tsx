"use client";

import { translateClient } from "@/hooks/use-translation";
import { getCurrentLanguage } from "@/lib/translation/utils";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// API-only full-page translator.
// Scans visible text nodes, batches via /api/translate, applies results.
// Skips elements marked with "notranslate" or translate="no".

function collectTranslatableTextNodes(root: ParentNode): Text[] {
  const filter: NodeFilter = {
    acceptNode(node: Node) {
      const parent = (node as Node & { parentElement: Element | null })
        .parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip invisible or excluded containers
      const tag = parent.tagName.toLowerCase();
      if (
        tag === "script" ||
        tag === "style" ||
        tag === "noscript" ||
        tag === "textarea" ||
        tag === "input" ||
        tag === "select" ||
        tag === "option" ||
        tag === "code" ||
        tag === "pre"
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      if (
        parent.classList.contains("notranslate") ||
        parent.getAttribute("translate") === "no"
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      // Only translate meaningful text
      const text = ((node as Text).nodeValue || "").replace(/\s+/g, " ").trim();
      if (!text || text.length <= 1) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

async function translateDocumentOnce(): Promise<void> {
  try {
    const target = getCurrentLanguage() as any;
    if (target === "en") return; // default language, nothing to do

    const nodes = collectTranslatableTextNodes(document.body);
    if (nodes.length === 0) return;

    // Deduplicate by text content to reduce API calls
    const textToNodes = new Map<string, Text[]>();
    for (const n of nodes) {
      const key = (n.nodeValue || "").replace(/\s+/g, " ").trim();
      if (!textToNodes.has(key)) textToNodes.set(key, []);
      textToNodes.get(key)!.push(n);
    }

    const uniqueTexts = Array.from(textToNodes.keys());
    // Batch translate
    const translated = await translateClient(uniqueTexts, target, {
      source: "en",
    });

    // Apply results
    uniqueTexts.forEach((original, i) => {
      const translatedText = translated?.[i];
      if (!translatedText || translatedText === original) return;
      const targets = textToNodes.get(original) || [];
      for (const t of targets) {
        // Guard: node might have been detached by React updates
        if (!t.isConnected) continue;
        t.nodeValue = translatedText;
      }
    });
  } catch (err) {
    // Non-fatal; fail closed
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ApiPageTranslator] translateDocumentOnce error", err);
    }
  }
}

export function ApiPageTranslator() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await translateDocumentOnce();

      // Short-lived observer to catch late content for ~1.5s
      const observer = new MutationObserver((mutations) => {
        const added = mutations.some((m) => m.addedNodes.length > 0);
        if (added) translateDocumentOnce();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      setTimeout(() => observer.disconnect(), 1500);

      // Also react to visibility/focus restores
      const onVisible = () => translateDocumentOnce();
      const onFocus = () => translateDocumentOnce();
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onFocus);

      return () => {
        observer.disconnect();
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onFocus);
      };
    };

    const cleanupPromise = run();
    return () => {
      cancelled = true;
      // cleanup handled in run's return when resolved
      void cleanupPromise;
    };
  }, [pathname]);

  return null;
}

export default ApiPageTranslator;
