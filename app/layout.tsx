import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import PageTransition from "@/components/shared/PageTransition";
import SmoothScroll from "@/components/shared/SmoothScroll";
import Navbar from "@/components/shared/Navbar";
import Rail from "@/components/shared/Rail";
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
   subset so the download stays a couple of kilobytes. */
const JP_GLYPHS =
    "表紙略歴作品仕事連絡衣脳ウェブ制間" +
    // marquee: ウェブ制作 / アプリ開発 / 設計・実装 / 裏側の構築 / 管理画面 / サイト刷新 / 保守・改善
    "アプリ開発設計・実装裏側の構築管理画面サイト刷新保守改善" +
    // "for you" close: 設計 (Scope) / 構築 (Build) / 公開 (Ship) — only 公 is new
    "公" +
    // About: 道のり (Journey) / 原点・進路・制作 (chapters) / 経験 (Experience) /
    // 実務 (Internship) / 道具 (Tools)
    "道り原点進路経験務具" +
    // Services: the four process steps, set in Japanese with the English under
    "何をするか誰のためか完成の定義" +
    "画面と流れデータ連携今回の範囲" +
    "早めの公開リンク触れる変更随時のフィードバック" +
    "公開と実機テストコードとアカウント引き継ぎの手引き" +
    // The closes, where each page's statement is set again in Japanese
    "作りたいものはありますか形になったものを見る" +
    "三つ目はあなたの番何を作りたいか教えてください";
const JP_FONT_URL = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&text=${encodeURIComponent(
    JP_GLYPHS
)}&display=swap`;

/* Runs before first paint. Gates every pre-animation state in globals.css so
   markup is never left hidden when JS is unavailable or motion is unwanted.

   It also decides, once per real page load, whether the hero gets its
   cinematic open — see lib/intro.ts. Landing on the home page earns it;
   arriving anywhere else, or routing home later, does not, and neither does
   asking for reduced motion. The attribute has to be here rather than in a
   component so the navbar is already out of frame on the first frame. */
const MOTION_GATE = `(function(){var d=document.documentElement;try{var m=window.matchMedia('(prefers-reduced-motion: reduce)');var s=function(){d.dataset.motion=m.matches?'off':'on'};s();m.addEventListener?m.addEventListener('change',s):m.addListener(s)}catch(e){d.dataset.motion='off'}var p=location.pathname;d.dataset.intro=d.dataset.motion==='on'&&(p==='/'||p==='')?'pending':'off';})();`;

export const metadata: Metadata = {
    metadataBase: new URL("https://keangarcia.vercel.app"),
    title: {
        default: `${personal.name} — ${personal.role}`,
        template: `%s — ${personal.name}`,
    },
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
                    <PageTransition>
                        <a
                            href="#main"
                            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-label focus:uppercase focus:text-on-ink"
                        >
                            Skip to content
                        </a>
                        <Rail />
                        <Navbar />
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
                    </PageTransition>
                </Providers>
            </body>
        </html>
    );
}
