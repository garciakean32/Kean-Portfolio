import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import SmoothScroll from "@/components/shared/SmoothScroll";
import ScrollDock from "@/components/shared/ScrollDock";
import ReloadNotice from "@/components/shared/ReloadNotice";
import Footer from "@/components/shared/Footer";
import { personal } from "@/lib/data";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-sans",
    display: "swap",
});

const sourceSerif = Source_Serif_4({
    subsets: ["latin"],
    // 400 only, upright and italic: nothing on the site sets the serif at any
    // other weight, and every weight listed here is a font file that ships.
    weight: ["400"],
    style: ["normal", "italic"],
    variable: "--font-serif",
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
   cinematic open — see lib/intro.ts. A fresh landing at the top of the page
   earns it; arriving at an anchor deeper down does not, and neither does
   asking for reduced motion. The attribute has to be here rather than in a
   component so the scroll dock is already faded out on the first frame. */
const MOTION_GATE = `(function(){var d=document.documentElement;try{var m=window.matchMedia('(prefers-reduced-motion: reduce)');var s=function(){d.dataset.motion=m.matches?'off':'on'};s();m.addEventListener?m.addEventListener('change',s):m.addListener(s)}catch(e){d.dataset.motion='off'}d.dataset.intro=d.dataset.motion==='on'&&!location.hash?'pending':'off';})();`;

const DESCRIPTION =
    "Full-stack web developer building modern, responsive websites and web applications for businesses and clients. Based in Philippines.";

export const metadata: Metadata = {
    metadataBase: new URL(personal.siteUrl),
    title: `${personal.name} — ${personal.role}`,
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
        title: `${personal.name} — ${personal.role}`,
        description:
            "Websites and web applications, built end to end. Based in Philippines.",
        url: "/",
        siteName: personal.name,
        type: "website",
        locale: "en_PH",
    },
    twitter: {
        card: "summary",
        title: `${personal.name} — ${personal.role}`,
        description:
            "Websites and web applications, built end to end. Based in Philippines.",
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
            className={`dark ${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
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
                    <ReloadNotice />
                    <main id="main">{children}</main>
                    <Footer />
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
