"use client";

import { translateClient } from "@/hooks/use-translation";
import { getCurrentLanguage } from "@/lib/translation/utils";

type QueueItem = {
  key: string;
  text: string;
  namespace?: string;
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
};

const queue: QueueItem[] = [];
let timer: any = null;
const FLUSH_MS = 50;
const MAX_BATCH = 50;

function flush() {
  timer = null;
  if (queue.length === 0) return;

  const batch = queue.splice(0, MAX_BATCH);
  const target = getCurrentLanguage() as any;
  const texts = batch.map((i) => i.text);
  const anyNamespace = batch[0]?.namespace;

  translateClient(texts, target, { namespace: anyNamespace, source: "en" })
    .then((out) => {
      batch.forEach((item, i) => {
        const v = out?.[i];
        item.resolve(typeof v === "string" && v.length > 0 ? v : item.text);
      });
    })
    .catch((err) => {
      batch.forEach((item) => item.resolve(item.text));
    });
}

export function requestTranslation(text: string, namespace?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push({ key: `${namespace ?? ""}:${text}`, text, namespace, resolve, reject });
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
    if (queue.length >= MAX_BATCH && timer) {
      clearTimeout(timer);
      flush();
    }
  });
}
