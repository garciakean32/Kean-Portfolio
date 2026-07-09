"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimations() {
    useEffect(() => {
        // Fade up animation for all sections
        const sections = document.querySelectorAll(".gsap-fade-up");
        sections.forEach((el) => {
            if (el.parentElement?.tagName.toLowerCase() === "main") return;

            gsap.fromTo(
                el,
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none none",
                    },
                }
            );
        });

        // Stagger children animation
        const staggerGroups = document.querySelectorAll(".gsap-stagger");
        staggerGroups.forEach((group) => {
            const children = group.children;
            gsap.fromTo(
                children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: "power3.out",
                    stagger: 0.15,
                    scrollTrigger: {
                        trigger: group,
                        start: "top 85%",
                        toggleActions: "play none none none",
                    },
                }
            );
        });

        // Horizontal line reveal
        const lines = document.querySelectorAll(".gsap-line");
        lines.forEach((el) => {
            gsap.fromTo(
                el,
                { scaleX: 0, transformOrigin: "left center" },
                {
                    scaleX: 1,
                    duration: 1,
                    ease: "power3.inOut",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        toggleActions: "play none none none",
                    },
                }
            );
        });

        return () => {
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, []);

    return null;
}
