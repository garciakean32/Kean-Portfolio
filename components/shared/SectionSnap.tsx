"use client";

import { useEffect, useRef } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";
const MIN_WHEEL_DELTA = 4;
const SAME_DIRECTION_DELAY = 520;
const SETTLE_DELAY = 250;
const NATIVE_SCROLL_RESUME_DELAY = 150;

const getSections = () =>
    Array.from(
        document.querySelectorAll<HTMLElement>("main > section, main > footer")
    );

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const getMaxScrollY = () =>
    document.documentElement.scrollHeight - window.innerHeight;

const getSnapTop = (section: HTMLElement) => {
    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const snapAlign = window.getComputedStyle(section).scrollSnapAlign;
    const targetTop = snapAlign.includes("end")
        ? sectionTop + rect.height - window.innerHeight
        : sectionTop;

    return clamp(targetTop, 0, getMaxScrollY());
};

const getNearestSectionIndex = (sections: HTMLElement[]) => {
    const currentY = window.scrollY;

    return sections.reduce((nearestIndex, section, index) => {
        const nearestDistance = Math.abs(
            getSnapTop(sections[nearestIndex]) - currentY
        );
        const distance = Math.abs(getSnapTop(section) - currentY);

        return distance < nearestDistance ? index : nearestIndex;
    }, 0);
};

const isNativeScrollTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest("textarea, select, input, [data-native-scroll]")
    );
};

export default function SectionSnap() {
    const targetIndexRef = useRef<number | null>(null);
    const directionRef = useRef<1 | -1 | null>(null);
    const lastCommandAtRef = useRef(0);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nativeScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const desktop = window.matchMedia(DESKTOP_QUERY);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        const clearSettleTimer = () => {
            if (settleTimerRef.current) {
                clearTimeout(settleTimerRef.current);
                settleTimerRef.current = null;
            }
        };

        const settleAfterSlide = () => {
            clearSettleTimer();

            settleTimerRef.current = setTimeout(() => {
                targetIndexRef.current = null;
                directionRef.current = null;
            }, SETTLE_DELAY);
        };

        const handleWheel = (event: WheelEvent) => {
            if (isNativeScrollTarget(event.target)) {
                // Suspend CSS scroll-snap so the browser's native scroll over
                // form inputs isn't hijacked into a section snap mid-scroll.
                document.documentElement.style.scrollSnapType = "none";

                if (nativeScrollTimerRef.current) {
                    clearTimeout(nativeScrollTimerRef.current);
                }

                nativeScrollTimerRef.current = setTimeout(() => {
                    document.documentElement.style.scrollSnapType = "";
                    nativeScrollTimerRef.current = null;
                }, NATIVE_SCROLL_RESUME_DELAY);

                return;
            }

            if (
                event.ctrlKey ||
                !desktop.matches ||
                Math.abs(event.deltaY) < MIN_WHEEL_DELTA
            ) {
                return;
            }

            const sections = getSections();
            if (sections.length < 2) return;

            event.preventDefault();

            const now = performance.now();
            const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;
            const isSameDirection = directionRef.current === direction;
            const currentIndex =
                targetIndexRef.current ?? getNearestSectionIndex(sections);

            if (
                isSameDirection &&
                now - lastCommandAtRef.current < SAME_DIRECTION_DELAY
            ) {
                return;
            }

            const targetIndex = clamp(
                currentIndex + direction,
                0,
                sections.length - 1
            );

            if (targetIndex === currentIndex) return;

            targetIndexRef.current = targetIndex;
            directionRef.current = direction;
            lastCommandAtRef.current = now;

            window.scrollTo({
                top: getSnapTop(sections[targetIndex]),
                behavior: reducedMotion.matches ? "auto" : "smooth",
            });

            settleAfterSlide();
        };

        window.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            clearSettleTimer();
            if (nativeScrollTimerRef.current) {
                clearTimeout(nativeScrollTimerRef.current);
            }
            document.documentElement.style.scrollSnapType = "";
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return null;
}
