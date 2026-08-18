"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { routes } from "@/lib/data";
import { gsap } from "@/lib/motion";
import { getLenis } from "@/lib/lenis";

const EASE_IO = [0.76, 0, 0.24, 1] as const;
const COVER = 0.42;
const REVEAL = 0.58;

type Ctx = { navigate: (href: string) => void; arrived: () => void };
const TransitionContext = createContext<Ctx | null>(null);

/**
 * Animations are driven by the frame loop, which browsers pause in a
 * backgrounded tab. Racing each one against a timer means a navigation can
 * never be left half-finished waiting for a frame that is not coming.
 */
const settled = (animation: Promise<unknown>, ms: number) =>
    Promise.race([animation, new Promise((resolve) => setTimeout(resolve, ms))]);

export const usePageTransition = () => {
    const ctx = useContext(TransitionContext);
    if (!ctx) throw new Error("usePageTransition must be used inside PageTransition");
    return ctx;
};

/**
 * Route transition and same-route scroll behaviour.
 *
 * A single panel lives in the persistent layout so it can survive the
 * navigation itself: it slides up to cover the page you are leaving, the route
 * changes underneath it, then it keeps travelling in the same direction to
 * uncover the page you arrived on. One continuous movement, not two.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const reduce = useReducedMotion();
    const controls = useAnimationControls();

    const [label, setLabel] = useState(
        () => routes.find((r) => r.href !== "/" && pathname.startsWith(r.href)) ?? routes[0]
    );
    // True only while the panel is on its way in. Released as soon as the
    // route is pushed, so an impatient second click is not swallowed.
    const covering = useRef(false);
    const pending = useRef<string | null>(null);

    /** Fast lift to the top of the current page, decelerating into a soft stop. */
    const scrollToTop = useCallback(() => {
        if (window.scrollY < 2) return;
        if (reduce) {
            window.scrollTo(0, 0);
            return;
        }
        // Lenis re-asserts its own scroll position every frame, so a plain
        // `window.scrollTo` tween below gets fought and snapped back — go
        // through its scrollTo instead whenever it's the one driving scroll.
        const lenis = getLenis();
        if (lenis) {
            lenis.scrollTo(0, {
                duration: Math.min(1.5, 0.7 + window.scrollY / 5000),
                easing: (t: number) => 1 - Math.pow(1 - t, 4),
            });
            return;
        }
        const proxy = { y: window.scrollY };
        gsap.killTweensOf(proxy);
        gsap.to(proxy, {
            y: 0,
            // Long enough to read as travel, short enough not to feel stuck.
            duration: Math.min(1.5, 0.7 + proxy.y / 5000),
            ease: "power4.out",
            overwrite: true,
            onUpdate: () => window.scrollTo(0, proxy.y),
        });
    }, [reduce]);

    const navigate = useCallback(
        (href: string) => {
            const target = href.split("#")[0] || "/";

            if (target === pathname) {
                scrollToTop();
                return;
            }
            if (covering.current) return;

            if (reduce) {
                router.push(href);
                return;
            }

            covering.current = true;
            pending.current = href;
            setLabel(
                routes.find((r) => r.href !== "/" && target.startsWith(r.href)) ?? routes[0]
            );

            settled(
                controls.start({ y: "0%", transition: { duration: COVER, ease: EASE_IO } }),
                COVER * 1000 + 200
            ).then(() => {
                if (pending.current) router.push(pending.current);
                pending.current = null;
                covering.current = false;
            });
        },
        [controls, pathname, reduce, router, scrollToTop]
    );

    /** Called by app/template.tsx once the destination has mounted. */
    const arrived = useCallback(() => {
        if (reduce) return;
        settled(
            controls.start({ y: "-100%", transition: { duration: REVEAL, ease: EASE_IO } }),
            REVEAL * 1000 + 200
        ).then(() => {
            // A newer navigation may have started covering again mid-reveal;
            // leave the panel where that one wants it.
            if (!covering.current) controls.set({ y: "100%" });
        });
    }, [controls, reduce]);

    /* Every internal link goes through the transition. Intercepting in the
       capture phase means next/link sees `defaultPrevented` and stands down,
       while any other handler on the link still runs. */
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const anchor = (event.target as HTMLElement | null)?.closest?.("a");
            if (!anchor) return;
            if (anchor.hasAttribute("download")) return;

            const target = anchor.getAttribute("target");
            if (target && target !== "_self") return;

            const href = anchor.getAttribute("href");
            if (!href || !href.startsWith("/") || href.startsWith("//")) return;
            // Leave files (the resume) and in-page anchors alone
            if (/\.[a-z0-9]+$/i.test(href.split(/[?#]/)[0])) return;

            event.preventDefault();
            navigate(href);
        };

        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, [navigate]);

    return (
        <TransitionContext.Provider value={{ navigate, arrived }}>
            {children}
            {!reduce && (
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-ink"
                    initial={{ y: "0%" }}
                    animate={controls}
                >
                    <span className="flex flex-col items-center gap-3 text-on-ink">
                        <span className="font-jp text-2xl tracking-[0.4em]">{label.jp}</span>
                        <span className="font-mono text-label uppercase opacity-60">
                            {label.label}
                        </span>
                    </span>
                </motion.div>
            )}
        </TransitionContext.Provider>
    );
}
