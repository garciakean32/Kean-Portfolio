export const personal = {
    name: "Kean Valgere E. Garcia",
    firstName: "Kean",
    lastName: "Garcia",
    role: "Full-Stack Web Developer",
    tagline: "I build things for the web.",
    bio: "I'm a web developer based in the Philippines, an IT graduate turning ideas into website projects. I love creating projects for a brand, and seeing the website slowly forming is something I enjoy.",
    bioExtended:
        "When I'm taking a break from coding, you'll usually find me watching animated series or playing video games. (￣_￣)",
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
   Routes — bilingual index used by the navbar, rail and footer
   ------------------------------------------------------------------ */

export type Route = {
    href: string;
    label: string;
    jp: string;
    index: string;
    caption: string;
};

export const routes: Route[] = [
    { href: "/", label: "Home", jp: "表紙", index: "01", caption: "Where it starts" },
    { href: "/about", label: "About", jp: "略歴", index: "02", caption: "Who is building it" },
    { href: "/projects", label: "Projects", jp: "作品", index: "03", caption: "What I have built" },
    { href: "/services", label: "Services", jp: "仕事", index: "04", caption: "What I can build for you" },
    { href: "/contact", label: "Contact", jp: "連絡", index: "05", caption: "Start a conversation" },
];

/* ------------------------------------------------------------------
   Marquee — services set in Japanese, glossed in English underneath so
   the meaning is never guesswork. Any glyph used here must also be in
   JP_GLYPHS in app/layout.tsx, or it will not have a font to render in.
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
   Home — "What can I do for you?"

   Five tiers per entry, set at five sizes on the page: a Japanese mark
   standing in for the index (`jp`), the opening the reader arrives with
   (`kicker`), the answer (`lead`, one array item per typeset line), the
   plain-English version (`title`), the detail (`body`), and the parts
   list (`note`).

   Each `jp` is drawn from `marqueeServices` above, so the section reads
   in the same vocabulary as the rest of the site and needs no new glyphs
   in the subset requested by the root layout.

   Written the way the services page is: by what changes for the reader,
   in the positive. Every entry describes a starting point, never a
   shortcoming.
   ------------------------------------------------------------------ */

export const capabilities = [
    {
        index: "01",
        jp: "ウェブ制作",
        kicker: "Your first site",
        lead: ["Found, understood,", "easy to reach"],
        title: "A website for your business",
        body: "A handful of well-made pages built around the question your visitor actually arrived with. Quick on a phone, clear to search engines, and yours to keep.",
        note: "Pages · Structure · Contact · Hosting",
    },
    {
        index: "02",
        jp: "アプリ開発",
        kicker: "An idea ready to be built",
        lead: ["An idea you can", "open in a browser"],
        title: "A web application shaped around your work",
        body: "You describe the thing you wish existed. I map it into screens, data and rules, then build it until you can open it and use it.",
        note: "Scope → Screens → Data → Build",
    },
    {
        index: "03",
        jp: "サイト刷新",
        kicker: "Ready for a refresh",
        lead: ["Same business,", "current decade"],
        title: "A rebuild of the site you already have",
        body: "The words are still right; the layout and the loading time have simply aged. Rebuilt on a modern stack, mobile-first, with everything that already works carried across.",
        note: "Migration · Rebuild · Performance",
    },
    {
        index: "04",
        jp: "裏側の構築",
        kicker: "The half beneath the surface",
        lead: ["Wired to", "something real"],
        title: "The backend behind the interface",
        body: "Accounts, databases, payments, email, uploads and third-party APIs — the machinery under an interface, built so everything above it holds steady.",
        note: "Accounts · Database · Payments · Email",
    },
    {
        index: "05",
        jp: "管理画面",
        kicker: "Running it yourself",
        lead: ["See it,", "then act on it"],
        title: "A dashboard for the people who run it",
        body: "Internal screens for the day to day: records, filters, roles and exports — so a price change or a new page is yours to make whenever you like.",
        note: "Records · Roles · Exports",
    },
    {
        index: "06",
        jp: "保守・改善",
        kicker: "Sharpening what is there",
        lead: ["Smaller work,", "measured"],
        title: "Improvements to the site you have",
        body: "Faster pages, a layout that holds on every screen, forms that deliver every time. Small work, measured against what changes for the person using it.",
        note: "Speed · Layout · Accessibility",
    },
];

/* ------------------------------------------------------------------
   Services page
   ------------------------------------------------------------------ */

export const services = [
    {
        index: "01",
        title: "Business websites",
        outcome: "People find you, understand you, and reach you.",
        body: "A handful of well-made pages built for the question your visitor actually arrived with. Responsive, quick to load, straightforward to update.",
        includes: ["Responsive layout", "Contact + email delivery", "SEO fundamentals", "Deployment"],
    },
    {
        index: "02",
        title: "Custom web applications",
        outcome: "Software shaped around how your work is done, not around a template.",
        body: "When an off-the-shelf tool almost fits but not quite, this is the alternative — screens, logic and data modelled on your process.",
        includes: ["Requirements mapping", "Data model", "Application UI", "Auth + roles"],
    },
    {
        index: "03",
        title: "Full-stack development",
        outcome: "One person accountable from the database to the button.",
        body: "Frontend and backend handled together, so nothing gets lost in the handoff between two halves of the same project.",
        includes: ["Frontend", "API layer", "Database", "Hosting setup"],
    },
    {
        index: "04",
        title: "Responsive frontend development",
        outcome: "It holds up on a phone, a laptop and everything between.",
        body: "Interface work from a design or a rough sketch, built with real breakpoints, keyboard access and reduced-motion support rather than a desktop layout squeezed smaller.",
        includes: ["Design to code", "Accessibility pass", "Motion + interaction", "Cross-device QA"],
    },
    {
        index: "05",
        title: "Backend & APIs",
        outcome: "The half nobody sees, holding up the half everybody does.",
        body: "Endpoints, data storage, validation and integrations — the machinery under an interface, whether that interface is mine or someone else's.",
        includes: ["REST APIs", "Database schema", "Third-party integrations", "Email + notifications"],
    },
    {
        index: "06",
        title: "Website modernization",
        outcome: "Same business, current decade.",
        body: "Rebuild an outdated site on a modern stack: faster, mobile-first, easier to maintain, with the content and the things that already worked carried across.",
        includes: ["Content migration", "Rebuild", "Performance", "Redirects"],
    },
    {
        index: "07",
        title: "Content systems",
        outcome: "You change your own text and images.",
        body: "A simple editing layer over the site so routine updates do not need a developer, a deployment, or a wait.",
        includes: ["Editable content", "Media handling", "Preview", "Handover guide"],
    },
    {
        index: "08",
        title: "Dashboards & admin tools",
        outcome: "See what is happening and act on it.",
        body: "Internal screens for the people who run the business: records, filters, states, and the actions that move something from one state to the next.",
        includes: ["Tables + filters", "Charts", "Role permissions", "Exports"],
    },
];

export const servicesNote =
    "Most real projects turn out to be a mix of two or three of these, not just one — the list above is where to start, not where to stop.";

export const process = [
    {
        index: "01",
        title: "Talk it through",
        body: "What are you trying to do, who is it for, and what has to be true for it to count as done. Before any code, we agree on that.",
        points: [
            { jp: "何をするか", en: "What it has to do" },
            { jp: "誰のためか", en: "Who it is for" },
            { jp: "完成の定義", en: "What done means" },
        ],
        image: "/images/lantern1.jpg",
    },
    {
        index: "02",
        title: "Map the build",
        body: "Screens, data and scope written down — including what is deliberately not in this round, so the edges are clear from the start.",
        points: [
            { jp: "画面と流れ", en: "Screens and flows" },
            { jp: "データと連携", en: "Data and integrations" },
            { jp: "今回の範囲", en: "Scope for this round" },
        ],
        image: "/images/gray umbrella.jpg",
    },
    {
        index: "03",
        title: "Build in the open",
        body: "You get a live link early and it keeps changing. Progress you can click through, not a status update.",
        points: [
            { jp: "早めの公開リンク", en: "A live link early" },
            { jp: "触れる変更", en: "Changes you can click" },
            { jp: "随時のフィードバック", en: "Feedback as it goes" },
        ],
        image: "/images/gray lantern.jpg",
    },
    {
        index: "04",
        title: "Launch and hand over",
        body: "Deployed, tested on real devices, and handed to you with the code, the accounts and a plain explanation of how to keep it running.",
        points: [
            { jp: "公開と実機テスト", en: "Deploy and device testing" },
            { jp: "コードとアカウント", en: "Code and accounts" },
            { jp: "引き継ぎの手引き", en: "A plain handover guide" },
        ],
        image: "/images/bonsai.jpg",
    },
];

export const principles = [
    {
        title: "Start with the problem",
        body: "The interesting technical decision is usually the second question. The first one is what the person on the other end is trying to get done.",
    },
    {
        title: "Ship something that works",
        body: "A small thing that works and gets used beats a large thing that is nearly ready. Everything that follows is easier than everything that came before it.",
    },
    {
        title: "Leave it maintainable",
        body: "The next person to open this code deserves to understand it quickly. Clear naming and a predictable structure age better than a clever shortcut that only made sense at the time.",
    },
];

/* ------------------------------------------------------------------
   About
   ------------------------------------------------------------------ */

/* `jp` marks the group the way the projects carry one — any glyph used here
   must also be in JP_GLYPHS in app/layout.tsx.

   Each tool carries a line saying what it actually does on a project, so the
   list reads as an index of decisions rather than a wall of logos. */
export const skills = [
    {
        category: "Frontend",
        jp: "画面",
        summary: "The half people see — structure, type, state, and the way it moves.",
        items: [
            { name: "React", note: "Components and state. The base everything else on this list sits on." },
            { name: "Next.js", note: "Routing, rendering and the build. What this site and both projects run on." },
            { name: "TypeScript", note: "Types on the data before it reaches a screen, so mistakes turn up while I'm writing rather than after." },
            { name: "Tailwind CSS", note: "Styling kept in the markup — one system across the whole project instead of a stylesheet drifting out of sync." },
            { name: "GSAP", note: "The scroll-linked reveals and the timing language behind them, including everything on this page." },
            { name: "Base UI / shadcn", note: "Accessible primitives for the parts nobody should be rebuilding by hand — dialogs, fields, menus." },
        ],
    },
    {
        category: "Backend",
        jp: "裏側",
        summary: "The half nobody sees, holding up the half everybody does.",
        items: [
            { name: "Node.js", note: "The runtime everything server-side runs on, so one language covers both ends of the project." },
            { name: "Express", note: "Routes and middleware when an API needs to stand on its own rather than live inside the app." },
            { name: "PostgreSQL (via Supabase)", note: "Where the data actually lives — relational tables, real constraints, queried directly." },
            { name: "Supabase Auth", note: "Accounts, sessions and row-level rules. What keeps one user's data out of another user's screen." },
            { name: "REST APIs", note: "The contract between the interface and the data — predictable routes, validated input, honest errors." },
            { name: "Resend", note: "Transactional email. The reason a message sent from a contact form actually arrives." },
        ],
    },
    {
        category: "Tools",
        jp: "道具",
        summary: "The day to day — where the work is written, reviewed and shipped from.",
        items: [
            { name: "Git", note: "Branches and history. The safety net that makes trying something risky a reasonable idea." },
            { name: "GitHub", note: "Where the repositories live, and where the work is reviewable rather than trapped on my machine." },
            { name: "VS Code", note: "The editor, kept plain — a few extensions rather than a setup I'd have to rebuild from memory." },
            { name: "Claude Code", note: "A second pair of hands for scaffolding and review. It drafts; the decisions stay mine." },
            { name: "Vercel", note: "Deploys and previews. Every push gets a link, so progress is something you click rather than read about." },
            { name: "Render Dashboard", note: "Where the longer-running services sit when a project needs something more than a serverless function." },
        ],
    },
];

export const journey = {
    intro:
        "I had been around computers ever since I was young. None of it was coding-related back then, but it is the reason I took Information Technology as my course in college — it was simply the closest thing to what I was already doing every day. That course became the beginning of my web development journey.",
    steps: [
        {
            jp: "原点",
            title: "Computers came first",
            description:
                "From a young age, I was already in front of a computer. Nothing about it was technical and none of it was coding — it was just the thing I spent most of my time on.",
        },
        {
            jp: "進路",
            title: "So IT was the natural choice",
            description:
                "When it was time to pick a course, I didn't have to think about it much. Information Technology was the closest one to what I was already used to doing, so that's where I went.",
        },
        {
            jp: "制作",
            title: "And IT led me to the web",
            description:
                "The course is what put me in front of real code, and out of everything it covered, web development is the part that stayed with me — it's been the direction I've followed since.",
        },
    ],
};

export const sideProjects = {
    intro:
        "While I was an intern at MeldCX Philippines working on the company's tasks, I also started developing two personal projects in my free time to further enhance my skills. One is an e-commerce website (K4 Threads), and the other is a website where you build your own AI chatbot (AskBrain) — you will see both of them in my works section below.",
    note:
        "Both of those websites have an AI chatbot integrated in the bottom right, running on the AskBrain platform.",
    highlights: [
        {
            jp: "実務",
            label: "Internship",
            title: "MeldCX Philippines",
            description:
                "My first taste of real work — company tasks, real deadlines, and a much better idea of how software is built outside of school.",
        },
        {
            jp: "受託",
            label: "Freelance",
            title: "Freelance Development",
            description:
                "Worked on an existing website built by another developer — adding features, fixing bugs, and reworking parts of the design, while learning what it takes to build on top of someone else's code.",
        },
        {
            jp: "衣",
            label: "Personal project",
            title: "K4 Threads",
            description:
                "Built an online clothing store end to end, from browsing products to checking out, so I could learn what a full e-commerce flow really takes.",
        },
        {
            jp: "脳",
            label: "Personal project",
            title: "AskBrain",
            description:
                "Made a platform where you feed the chatbot your own knowledge so that it can answer questions the way you would, built so I could learn how to work AI into a site.",
        },
    ],
};

/* ------------------------------------------------------------------
   Projects
   `stack` and `role` describe how these were built — edit freely.
   ------------------------------------------------------------------ */

export const projects = [
    {
        id: 1,
        slug: "k4-threads",
        title: "K4 Threads",
        jp: "衣",
        summary: "An online clothing store, built end to end.",
        description:
            "A e-commerce clothing platform designed to provide customers with a convenient and seamless online shopping experience.",
        note:
            "Built to find out what a complete e-commerce flow really takes — browsing, product detail, cart and checkout, rather than a storefront that stops at the product grid.",
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/K4 Threads project.png",
        featured: true,
        type: "Personal Project",
        status: {
            label: "Not ready yet",
            reason:
                "Checkout is not live. Taking real payments means registering the payment method under a business, and I do not have those business credentials yet — everything up to the payment step works.",
        },
        role: "Solo — design, frontend, backend",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
        highlights: [
            "Product browsing through to checkout",
            "AskBrain chatbot embedded in the corner",
            "Deployed and live on Vercel",
        ],
    },
    {
        id: 2,
        slug: "askbrain",
        title: "AskBrain",
        jp: "脳",
        summary: "Build a chatbot, feed it your knowledge, share it anywhere.",
        description:
            "A platform where users build their own chatbot — a brain — and feed it the knowledge it answers from. Each brain can be shared with customers through a link, a QR code, or embedded straight into a website with a script.",
        note:
            "The harder of the two: it had to hold other people's content, answer from it, and then leave the building — as a link, a QR code, or a script tag on someone else's site.",
        liveUrl: "https://askbrain-user.vercel.app",
        image: "/images/askbrain project.png",
        featured: true,
        type: "Personal Project",
        status: {
            label: "Not ready yet",
            reason:
                "The 7-day trial works, so you can build a brain and try it end to end. Paying after it runs out does not: the payment method needs business credentials I do not have yet.",
        },
        role: "Solo — design, frontend, backend",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
        highlights: [
            "Create a brain and give it your own knowledge",
            "Share by link, QR code, or embed script",
            "Powers the chatbot on K4 Threads",
        ],
    },
];

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

export const stats = [
    { value: getCodingYears(), label: "Years of coding" },
    { value: "2", label: "Personal projects" },
    { value: `${getAge()}`, label: "Years of age" },
];
