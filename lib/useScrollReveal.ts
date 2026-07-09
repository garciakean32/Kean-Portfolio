import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.classList.add("section-hidden");

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.remove("section-hidden");
                    el.classList.add("section-visible");
                    observer.unobserve(el);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
}