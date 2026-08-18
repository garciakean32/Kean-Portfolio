"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePageTransition } from "@/components/shared/PageTransition";
import { ScrollTrigger } from "@/lib/motion";

/**
 * `template.tsx` remounts on every navigation, which makes it the right place
 * to tell the persistent transition panel that the destination has painted and
 * it can finish its travel.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { arrived } = usePageTransition();

    useEffect(() => {
        arrived();
        // Section geometry is measured while the panel is still covering the
        // page; re-measure once it has cleared and the fonts have settled.
        const id = window.setTimeout(() => ScrollTrigger.refresh(), 700);
        return () => window.clearTimeout(id);
    }, [pathname, arrived]);

    return <>{children}</>;
}
