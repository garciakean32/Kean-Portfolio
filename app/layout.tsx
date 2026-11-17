import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import SmoothScroll from "@/components/shared/SmoothScroll";
import ScrollDock from "@/components/shared/ScrollDock";
import Footer from "@/components/shared/Footer";
import DoodleArea from "@/components/shared/DoodleArea";
import { personal } from "@/lib/data";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-mono",
    display: "swap",
});

/* Runs before first paint. Gates every pre-animation state in globals.css so
   markup is never left hidden when JS is unavailable or motion is unwanted.

   It also decides, once per real page load, whether the hero gets its
   cinematic open — see lib/intro.ts. A fresh landing earns it, and so does
   every refresh: a reload always starts again from the hero, locked until
   it has introduced itself. Arriving on a shared link to a section deeper
   down does not, and neither does asking for reduced motion.

   A refresh drops any `#section` from the address first. Nothing on the site
   writes one — the section links scroll without touching the URL — so one
   is only there from a copied link or a modifier-click, and left in place
   it would quietly skip the open on every reload after. The attribute has
   to be here rather than in a component so the section menu is already
   faded out on the first frame. */
const MOTION_GATE = `(function(){var d=document.documentElement;try{var m=window.matchMedia('(prefers-reduced-motion: reduce)');var s=function(){d.dataset.motion=m.matches?'off':'on'};s();m.addEventListener?m.addEventListener('change',s):m.addListener(s)}catch(e){d.dataset.motion='off'}try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='reload'&&location.hash)history.replaceState(history.state,'',location.pathname+location.search)}catch(e){}d.dataset.intro=d.dataset.motion==='on'&&!location.hash?'pending':'off';})();`;

const TITLE = "Kean Garcia | Portfolio";

const DESCRIPTION =
    "Kean Valgere E. Garcia — full-stack web developer from Cagayan de Oro, Philippines. Who I am, how I got here, and how to reach me.";

export const metadata: Metadata = {
    metadataBase: new URL(personal.siteUrl),
    title: TITLE,
    description: DESCRIPTION,
    // One page, one address: said out loud so a crawler that arrives on an
    // anchor or with a tracking parameter still indexes the one URL.
    alternates: { canonical: "/" },
    authors: [{ name: personal.name, url: personal.siteUrl }],
    creator: personal.name,
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: "/",
        siteName: personal.name,
        type: "website",
        locale: "en_PH",
    },
    twitter: {
        card: "summary",
        title: TITLE,
        description: DESCRIPTION,
    },
};

/* Who the site is about, in the form a search engine reads rather than
   infers. Kept to what the page already says out loud. */
const PERSON_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: personal.name,
    jobTitle: personal.role,
    description: DESCRIPTION,
    url: personal.siteUrl,
    email: `mailto:${personal.email}`,
    address: { "@type": "PostalAddress", addressLocality: personal.location },
};

export const viewport: Viewport = {
    // The site has one mode.
    themeColor: "#000000",
    // Said in a meta tag rather than only in CSS, because the browser reads it
    // before the stylesheet arrives: it is what the base canvas is painted
    // with in the gap between one document being released and the next one
    // being styled. Without it that gap is white, which is what the hero's
    // WebGL band flashed on every reload.
    colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: MOTION_GATE }} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
                />
            </head>
            <body>
                <SmoothScroll />
                <Providers>
                    <a
                        href="#main"
                        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-label focus:uppercase focus:text-on-ink"
                    >
                        Skip to content
                    </a>
                    <ScrollDock />
                    {/* The whole page, hero to footer, is one sheet the
                        reader can doodle on — see DoodleArea. */}
                    <DoodleArea>
                        <main id="main">{children}</main>
                        <Footer />
                    </DoodleArea>
                    <div className="grain" aria-hidden="true" />
                    <div
                        className="intro-curtain js-intro-curtain"
                        data-edge="top"
                        aria-hidden="true"
                    />
                    <div
                        className="intro-curtain js-intro-curtain"
                        data-edge="bottom"
                        aria-hidden="true"
                    />
                </Providers>
            </body>
        </html>
    );
}
