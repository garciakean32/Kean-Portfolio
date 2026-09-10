export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Full-Stack Web Developer",
    bio: "I develop websites around a brand, product, or business concept, from simple brochure sites to more comprehensive platforms built to improve user experience and support business goals — and what I enjoy most is watching a site slowly take shape.",
    email: "garcia.kean32@gmail.com",
    location: "Cagayan de Oro City, PH",
    timezone: "UTC+8",
    resumeUrl: "/Kean Valgere E. Garcia_Resume.pdf",
    /* Where the site lives. Every absolute URL the page hands a crawler —
       canonical, sitemap, robots, the structured data in the root layout —
       resolves from this one, so a move is one line. */
    siteUrl: "https://keangarcia.vercel.app",
};

/* ------------------------------------------------------------------
   Sections — the whole site is one page, so the "routes" are anchors.
   Used by the navbar, the rail and the footer.
   ------------------------------------------------------------------ */

export type Section = {
    id: string;
    label: string;
};

/* No numbering. The order is the order they are in — putting "01" on the
   home section only ever told the reader something they already knew. */
export const sections: Section[] = [
    { id: "top", label: "Home" },
    { id: "about", label: "About" },
    { id: "work", label: "Work" },
    { id: "services", label: "Services" },
    { id: "contact", label: "Contact" },
];

/* ------------------------------------------------------------------
   What I build — one line each.
   ------------------------------------------------------------------ */

export const offerings = [
    { title: "Business websites", line: "Found, understood, easy to reach." },
    { title: "Web applications", line: "An idea you can open in a browser." },
    { title: "Backend & APIs", line: "Accounts, data, payments, email." },
    { title: "Dashboards", line: "See what is happening, then act on it." },
    { title: "Site rebuilds", line: "Same business, current decade." },
    { title: "Maintenance", line: "Faster, steadier, easier to change." },
];

export const process = [
    {
        title: "Talk it through",
        line: "What it does, who it is for, and what has to be true for it to count as done.",
        image: "/images/lantern1.jpg",
    },
    {
        title: "Map the build",
        line: "Screens, data and scope — including what is deliberately not in this round.",
        image: "/images/gray umbrella.jpg",
    },
    {
        title: "Build in the open",
        line: "A live link early, and it keeps changing. Progress you can click through.",
        image: "/images/gray lantern.jpg",
    },
    {
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
        items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Base UI"],
    },
    {
        category: "Backend",
        items: ["Node.js", "Express", "PostgreSQL", "Supabase", "REST APIs", "Resend"],
    },
    {
        category: "Tools",
        items: ["Git", "GitHub", "VS Code", "Claude Code", "Vercel", "Render"],
    },
];

/* ------------------------------------------------------------------
   Experience — the story in order: school, degree, internship, freelance.
   `label` is the connective rather than a year, so the sequence reads
   without claiming dates.
   ------------------------------------------------------------------ */

export const experience = [
    {
        label: "Studied",
        title: "IT at USTP",
        line: "Studied at the University of Science and Technology of Southern Philippines, where I wrote my first real lines of code.",
    },
    {
        label: "Graduated",
        title: "A degree, and a direction",
        line: "I left with an Information Technology degree and a much clearer idea of what I actually wanted to build.",
    },
    {
        label: "Interned",
        title: "MeldCX Philippines",
        line: "Company tasks and real deadlines — my first look at how software gets built outside of school.",
    },
    {
        label: "Personal",
        title: "Personal projects",
        line: "Ideas I built end to end, from database through to design, on my own time.",
    },
    {
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
        title: "K4 Threads",
        summary: "An online clothing store, built end to end — browsing through to checkout.",
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/K4 Threads project.webp",
        type: "Personal project",
        status: {
            label: "Not ready yet",
            reason:
                "Checkout is not live. Taking real payments means registering the payment method under a business, and I do not have those business credentials yet — everything up to the payment step works.",
        },
    },
    {
        id: 2,
        title: "AskBrain",
        summary: "Build a chatbot, feed it your own knowledge, share it by link, QR or embed.",
        liveUrl: "https://askbrain-user.vercel.app",
        image: "/images/askbrain project.webp",
        type: "Personal project",
        status: {
            label: "Not ready yet",
            reason:
                "The free trial works, so you can build a brain and try it end to end. Paying after it runs out does not: the payment method needs business credentials I do not have yet.",
        },
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
