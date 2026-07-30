const MIN_DURATION = 320;
const MAX_DURATION = 700;
const MS_PER_PIXEL = 0.25;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const easeInOutCubic = (progress: number) =>
    progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;

const getTargetTop = (hash: string) => {
    const maxTop = document.documentElement.scrollHeight - window.innerHeight;

    if (hash === "" || hash === "#") return 0;

    const element = document.querySelector<HTMLElement>(hash);
    if (!element) return null;

    return clamp(element.getBoundingClientRect().top + window.scrollY, 0, maxTop);
};

/** Animated scroll to a hash target — fast, but never an instant jump. */
export function scrollToHash(hash: string) {
    const targetTop = getTargetTop(hash);
    if (targetTop === null) return;

    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    if (Math.abs(distance) < 1) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo({ top: targetTop, behavior: "auto" });
        return;
    }

    const root = document.documentElement;
    const previousSnapType = root.style.scrollSnapType;
    // Suspend CSS scroll-snap so it can't fight the animated scroll.
    root.style.scrollSnapType = "none";

    let cancelled = false;
    const cancel = () => {
        cancelled = true;
    };

    const finish = () => {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        root.style.scrollSnapType = previousSnapType;
    };

    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });

    const duration = clamp(
        Math.abs(distance) * MS_PER_PIXEL,
        MIN_DURATION,
        MAX_DURATION
    );
    const startedAt = performance.now();

    const step = (now: number) => {
        if (cancelled) {
            finish();
            return;
        }

        const progress = Math.min((now - startedAt) / duration, 1);
        window.scrollTo(0, startTop + distance * easeInOutCubic(progress));

        if (progress < 1) {
            requestAnimationFrame(step);
            return;
        }

        finish();
    };

    requestAnimationFrame(step);
}
