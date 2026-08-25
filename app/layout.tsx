import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import SmoothScroll from "@/components/shared/SmoothScroll";
import ScrollDock from "@/components/shared/ScrollDock";
import Footer from "@/components/shared/Footer";
import { personal } from "@/lib/data";

const archivo = Archivo({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-archivo",
    display: "swap",
});

const newsreader = Newsreader({
    subsets: ["latin"],
    weight: ["300", "400"],
    style: ["normal", "italic"],
    variable: "--font-newsreader",
    display: "swap",
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-plex-mono",
    display: "swap",
});

/* The handful of Japanese characters the site sets, requested as a `text`
   subset so the download stays a couple of kilobytes. Anything set in
   `font-jp` anywhere on the site has to appear here or it has no font to
   render in. */
const JP_GLYPHS =
    // the dock's section marks and the hero
    "表紙略歴作品仕事連絡和風" +
    // marquee and the "what I build" marks
    "ウェブ制作アプリ開発設計・実装裏側の構築管理画面サイト刷新保守改善" +
    // process steps
    "相談公" +
    // about: the experience stops and the shelf
    "学び卒業自実務受託経験道具衣脳";
const JP_FONT_URL = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&text=${encodeURIComponent(
    JP_GLYPHS
)}&display=swap`;

/* Runs before first paint. Gates every pre-animation state in globals.css so
   markup is never left hidden when JS is unavailable or motion is unwanted.

   It also decides, once per real page load, whether the hero gets its
   cinematic open — see lib/intro.ts. A fresh landing at the top of the page
   earns it; arriving at an anchor deeper down does not, and neither does
   asking for reduced motion. The attribute has to be here rather than in a
   component so the scroll dock is already faded out on the first frame. */
const MOTION_GATE = `(function(){var d=document.documentElement;try{var m=window.matchMedia('(prefers-reduced-motion: reduce)');var s=function(){d.dataset.motion=m.matches?'off':'on'};s();m.addEventListener?m.addEventListener('change',s):m.addListener(s)}catch(e){d.dataset.motion='off'}d.dataset.intro=d.dataset.motion==='on'&&!location.hash?'pending':'off';})();`;

export const metadata: Metadata = {
    metadataBase: new URL("https://keangarcia.vercel.app"),
    title: `${personal.name} — ${personal.role}`,
    description:
        "Full-stack web developer building modern, responsive websites and web applications for businesses and clients. Based in Philippines.",
    openGraph: {
        title: `${personal.name} — ${personal.role}`,
        description:
            "Websites and web applications, built end to end. Based in Philippines.",
        type: "website",
        locale: "en_PH",
    },
};

export const viewport: Viewport = {
    // The site has one mode.
    themeColor: "#0e0e10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`dark ${archivo.variable} ${newsreader.variable} ${plexMono.variable}`}
        >
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link rel="stylesheet" href={JP_FONT_URL} />
                <script dangerouslySetInnerHTML={{ __html: MOTION_GATE }} />
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
