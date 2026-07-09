"use client";

import { useEffect, useRef } from "react";

const SECTION_IDS = ["hero", "about", "skills", "projects", "contact"];

export default function SectionSnap() {
    const isScrolling = useRef(false);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (isScrolling.current) return;

            const scrollY = window.scrollY;
            const sections = SECTION_IDS.map((id) =>
                document.getElementById(id)
            ).filter(Boolean) as HTMLElement[];

            // Find current section index
            let currentIndex = 0;
            sections.forEach((section, i) => {
                const top = section.getBoundingClientRect().top;
                if (top <= 10) currentIndex = i;
            });

            let targetIndex = currentIndex;

            if (e.deltaY > 0 && currentIndex < sections.length - 1) {
                // Scrolling down
                targetIndex = currentIndex + 1;
            } else if (e.deltaY < 0 && currentIndex > 0) {
                // Scrolling up
                targetIndex = currentIndex - 1;
            } else {
                return;
            }

            e.preventDefault();
            isScrolling.current = true;

            sections[targetIndex].scrollIntoView({ behavior: "smooth" });

            setTimeout(() => {
                isScrolling.current = false;
            }, 900);
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    return null;
}