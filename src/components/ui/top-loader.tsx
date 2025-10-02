"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Very lightweight top loader: shows a thin bar for a short period on route changes
export function TopLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setVisible(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setVisible(false), 700);
    }
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60]"
      style={{ pointerEvents: "none", height: 2 }}
    >
      <div
        className={`h-[2px] transition-all duration-200 ${visible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
        style={{
          transformOrigin: 'left',
          background: 'linear-gradient(90deg, #fb923c, #f97316)',
        }}
      />
    </div>
  );
}
