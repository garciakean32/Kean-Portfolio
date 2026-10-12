/**
 * The site is dark, full stop — `dark` is set on <html> in the root layout, so
 * there is no theme provider and no flash-of-wrong-theme script to run.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
