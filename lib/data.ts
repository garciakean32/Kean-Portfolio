export const personal = {
    name: "Kean Valgere E. Garcia",
    firstName: "Kean",
    lastName: "Garcia",
    role: "Full-Stack Web Developer",
    bio: "An IT graduate from the Philippines. I take a project from the database through to the design — and the part I enjoy most is watching a site slowly take shape.",
    email: "garcia.kean32@gmail.com",
    location: "Cagayan de Oro City, PH",
    coordinates: "8.4542° N / 124.6319° E",
    timezone: "UTC+8",
    resumeUrl: "/Kean Valgere E. Garcia_Resume.pdf",
    social: {
        github: "https://github.com/garciakean32",
        instagram: "https://www.instagram.com/kean.garcia32",
        facebook: "https://www.facebook.com/kean.valgere.garcia.2024/photos",
    },
};

/* ------------------------------------------------------------------
   Sections — the whole site is one page, so the "routes" are anchors.
   Used by the navbar, the rail and the footer.
   ------------------------------------------------------------------ */

export type Section = {
    id: string;
    label: string;
    jp: string;
};

/* No numbering. The order is the order they are in — putting "01" on the
   home section only ever told the reader something they already knew. */
export const sections: Section[] = [
    { id: "top", label: "Home", jp: "表紙" },
    { id: "about", label: "About", jp: "略歴" },
    { id: "work", label: "Work", jp: "作品" },
    { id: "services", label: "Services", jp: "仕事" },
    { id: "contact", label: "Contact", jp: "連絡" },
];

/* ------------------------------------------------------------------
   Marquee — services set in Japanese, glossed in English underneath.
   Any glyph used here must also be in JP_GLYPHS in app/layout.tsx.
   ------------------------------------------------------------------ */

export const marqueeServices = [
    { jp: "ウェブ制作", en: "Websites" },
    { jp: "アプリ開発", en: "Web apps" },
    { jp: "設計・実装", en: "Design & build" },
    { jp: "裏側の構築", en: "Backend & APIs" },
    { jp: "管理画面", en: "Dashboards" },
    { jp: "サイト刷新", en: "Modernization" },
    { jp: "保守・改善", en: "Maintenance" },
];

/* ------------------------------------------------------------------
   What I build — one line each, drawn from the marquee's vocabulary so
   no new glyphs are needed.
   ------------------------------------------------------------------ */

export const offerings = [
    { jp: "ウェブ制作", title: "Business websites", line: "Found, understood, easy to reach." },
    { jp: "アプリ開発", title: "Web applications", line: "An idea you can open in a browser." },
    { jp: "裏側の構築", title: "Backend & APIs", line: "Accounts, data, payments, email." },
    { jp: "管理画面", title: "Dashboards", line: "See what is happening, then act on it." },
    { jp: "サイト刷新", title: "Site rebuilds", line: "Same business, current decade." },
    { jp: "保守・改善", title: "Maintenance", line: "Faster, steadier, easier to change." },
];

export const process = [
    {
        index: "01",
        jp: "相談",
        title: "Talk it through",
        line: "What it does, who it is for, and what has to be true for it to count as done.",
        image: "/images/lantern1.jpg",
    },
    {
        index: "02",
        jp: "設計",
        title: "Map the build",
        line: "Screens, data and scope — including what is deliberately not in this round.",
        image: "/images/gray umbrella.jpg",
    },
    {
        index: "03",
        jp: "構築",
        title: "Build in the open",
        line: "A live link early, and it keeps changing. Progress you can click through.",
        image: "/images/gray lantern.jpg",
    },
    {
        index: "04",
        jp: "公開",
        title: "Launch and hand over",
        line: "Deployed, tested on real devices, and handed over with the code and the accounts.",
        image: "/images/bonsai.jpg",
    },
];

/* ------------------------------------------------------------------
   About — the shelf
   ------------------------------------------------------------------ */

export const skills = [
    {
        category: "Frontend",
        jp: "画面",
        items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Base UI"],
    },
    {
        category: "Backend",
        jp: "裏側",
        items: ["Node.js", "Express", "PostgreSQL", "Supabase", "REST APIs", "Resend"],
    },
    {
        category: "Tools",
        jp: "道具",
        items: ["Git", "GitHub", "VS Code", "Claude Code", "Vercel", "Render"],
    },
];

/* ------------------------------------------------------------------
   Experience — the story in order: school, degree, internship, freelance.
   `stage` is the connective rather than a year, so the sequence reads
   without claiming dates. `ratio` and `caption` travel with the picture.
   ------------------------------------------------------------------ */

export const experience = [
    {
        jp: "学び",
        label: "Studied",
        title: "IT at USTP",
        line: "Four years at the University of Science and Technology of Southern Philippines, where I wrote my first real lines of code.",
    },
    {
        jp: "卒業",
        label: "Graduated",
        title: "A degree, and a direction",
        line: "I left with an Information Technology degree and a much clearer idea of what I actually wanted to build.",
    },
    {
        jp: "実務",
        label: "Interned",
        title: "MeldCX Philippines",
        line: "Company tasks and real deadlines — my first look at how software gets built outside of school.",
    },
    {
        // 自作 — "made by one's own hand", which is the claim the entry is
        // actually making. 個人 would only have said "private".
        jp: "自作",
        label: "Personal",
        title: "Personal projects",
        line: "Ideas I built end to end, from database through to design, on my own time.",
    },
    {
        jp: "受託",
        label: "Freelancing",
        title: "Freelance work",
        line: "Features, fixes and a redesign on another developer's codebase.",
    },
];

/* ------------------------------------------------------------------
   Hero — the poster's small stacked list, bottom left
   ------------------------------------------------------------------ */

export const heroList = [
    "Websites",
    "Web apps",
    "Backend & APIs",
    "Dashboards",
    "And many other things",
];

/* ------------------------------------------------------------------
   Projects
   ------------------------------------------------------------------ */

export const projects = [
    {
        id: 1,
        slug: "k4-threads",
        title: "K4 Threads",
        jp: "衣",
        summary: "An online clothing store, built end to end — browsing through to checkout.",
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/K4 Threads project.png",
        type: "Personal project",
        status: {
            label: "Not ready yet",
            reason:
                "Checkout is not live. Taking real payments means registering the payment method under a business, and I do not have those business credentials yet — everything up to the payment step works.",
        },
        role: "Solo — design, frontend, backend",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    },
    {
        id: 2,
        slug: "askbrain",
        title: "AskBrain",
        jp: "脳",
        summary: "Build a chatbot, feed it your own knowledge, share it by link, QR or embed.",
        liveUrl: "https://askbrain-user.vercel.app",
        image: "/images/askbrain project.png",
        type: "Personal project",
        status: {
            label: "Not ready yet",
            reason:
                "The 7-day trial works, so you can build a brain and try it end to end. Paying after it runs out does not: the payment method needs business credentials I do not have yet.",
        },
        role: "Solo — design, frontend, backend",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    },
];

export const projectsNote =
    "Both sites run the AskBrain chatbot in the bottom-right corner.";

/* ------------------------------------------------------------------
   Derived stats
   ------------------------------------------------------------------ */

const getAge = () => {
    const today = new Date();
    const birthday = new Date(2002, 1, 28); // month is 0-indexed, so 1 = February
    let age = today.getFullYear() - birthday.getFullYear();
    const hasHadBirthdayThisYear =
        today.getMonth() > birthday.getMonth() ||
        (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
    if (!hasHadBirthdayThisYear) age--;
    return age;
};

const getCodingYears = () => {
    const today = new Date();
    const started = new Date(2023, 2, 10); // month 0-indexed, 2 = March
    let years = today.getFullYear() - started.getFullYear();
    const hasPassed =
        today.getMonth() > started.getMonth() ||
        (today.getMonth() === started.getMonth() && today.getDate() >= started.getDate());
    if (!hasPassed) years--;
    return years < 1 ? "1" : `${years}+`;
};

export const facts = [
    { value: getCodingYears(), label: "Years coding" },
    { value: "2", label: "Live products" },
    { value: `${getAge()}`, label: "Years of age" },
    { value: personal.timezone, label: "Timezone" },
];
