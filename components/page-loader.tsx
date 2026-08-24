"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const finishLoading = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled) return;

      window.requestAnimationFrame(() => {
        if (!cancelled) setVisible(false);
      });
    };

    if (document.readyState === "complete") {
      void finishLoading();
    } else {
      window.addEventListener("load", finishLoading, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", finishLoading);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="site-preloader" role="status" aria-label="در حال بارگذاری">
      <div className="site-preloader-mark">
        <Image src="/ozone-logo.svg" alt="اُزون" width={64} height={64} priority />
        <span className="site-preloader-spinner" aria-hidden="true" />
      </div>
    </div>
  );
}
