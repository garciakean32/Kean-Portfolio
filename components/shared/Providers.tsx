/**
 * The site is dark, full stop — `dark` is set on <html> in the root layout, so
 * there is no theme provider and no flash-of-wrong-theme script to run.
 * Individual sections invert to paper with the `.light-panel` class instead
 * (see globals.css), which re-declares the colour tokens for its subtree.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
