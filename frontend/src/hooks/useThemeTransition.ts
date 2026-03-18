"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { flushSync } from "react-dom";

export function useThemeTransition() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback((event: React.MouseEvent | HTMLElement) => {
    // @ts-ignore
    if (typeof document === "undefined" || !document.startViewTransition) {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      return;
    }

    const x = (event as any)?.clientX ?? (event as any)?.currentTarget?.getBoundingClientRect().left ?? window.innerWidth / 2;
    const y = (event as any)?.clientY ?? (event as any)?.currentTarget?.getBoundingClientRect().top ?? window.innerHeight / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [resolvedTheme, setTheme]);

  return { toggleTheme, theme, resolvedTheme };
}
