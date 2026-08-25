"use client";

import { scrollToSection } from "@/lib/sections";

/**
 * An in-page link. Stays a real `href="#id"` so it is copyable, focusable and
 * works with JS off — the click handler only exists to hand the scroll to
 * Lenis, which would otherwise fight a native anchor jump.
 */
export default function SectionLink({
    id,
    className,
    children,
    onNavigate,
    ...rest
}: {
    id: string;
    className?: string;
    children: React.ReactNode;
    onNavigate?: () => void;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "onClick">) {
    return (
        <a
            href={`#${id}`}
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                onNavigate?.();
                scrollToSection(id);
            }}
            className={className}
            {...rest}
        >
            {children}
        </a>
    );
}
