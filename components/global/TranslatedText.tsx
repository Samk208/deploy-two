"use client";

import { requestTranslation } from "@/lib/translation/batcher";
import { useEffect, useMemo, useState } from "react";

type Props = {
  children: string;
  namespace?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  fallback?: string;
};

export function TranslatedText({
  children,
  namespace,
  as = "span",
  className,
  fallback,
}: Props) {
  const [text, setText] = useState<string>(children);

  const Element = useMemo(() => as, [as]) as any;

  useEffect(() => {
    let mounted = true;
    requestTranslation(children, namespace)
      .then((v) => {
        if (mounted) setText(v || children);
      })
      .catch(() => {
        if (mounted && fallback) setText(fallback);
      });
    return () => {
      mounted = false;
    };
  }, [children, namespace, fallback]);

  // Mark as notranslate to prevent Google widget from double-translating
  const finalClassName = className ? `${className} notranslate` : "notranslate";
  return (
    <Element className={finalClassName} translate="no">
      {text}
    </Element>
  ) as any;
}
