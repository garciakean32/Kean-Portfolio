export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Full-Stack Web Developer",
    bio: "I develop websites for a brand, product, or business concept, from simple brochure sites to more comprehensive platforms built to improve user experience and support business goals — and what I enjoy most is watching a site slowly take shape.",
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
   Used by the section menu and the footer's index. The footer itself is
   not one of them: it is the end of the page, not a place to jump to.
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
    { id: "experience", label: "Experience" },
    { id: "works", label: "Works" },
    { id: "video", label: "Video" },
    { id: "contact", label: "Contact" },
];

/* ------------------------------------------------------------------
   Video introduction — a placeholder until it is recorded.

   To add it: put the file in `public/videos/` and set `src` to its path,
   e.g. "/videos/kean-intro.mp4". `poster` is optional — a still shown
   before it plays. While `src` is empty the section shows a "coming soon"
   frame instead of a player.
   ------------------------------------------------------------------ */

export const introVideo = {
    src: "",
    poster: "",
};

/* ------------------------------------------------------------------
   Experience — the story in order: school, degree, internship, personal
   projects, freelance. `label` is the connective — what the stop was, in
   the corner while its card is centred and on the card when it is opened.

   `timeline` is when, along the top and on the opened card, and `story` is
   the paragraph an opened card reads out, its start shown beside the card:
   the short version of each stop told in full, with what I actually did
   there taken from the resume (public/Kean Valgere E. Garcia_Resume.pdf).
   Keep the two telling the same story.

   `image` is the photo on that card — a path under `public/`. Portrait
   crops best (the card is 4:5, cropped about the centre). Left empty, the
   card shows a plain placeholder.
   ------------------------------------------------------------------ */

export const experience = [
    {
        label: "Studied",
        title: "IT at USTP",
        timeline: "2021 – 2026",
        story: "I studied Information Technology at the University of Science and Technology of Southern Philippines, and it is where I wrote my first real lines of code. Somewhere between the coursework and the projects, building for the web stopped being a subject I had to take and became the thing I wanted to do.",
        image: "/images/gray branch.jpg",
    },
    {
        label: "Graduated",
        title: "A degree, and a direction",
        timeline: "June 2026",
        story: "I graduated with a Bachelor of Information Technology — and with a much clearer idea of what I actually wanted to build: websites and web apps that work on every screen, make sense to the people using them, and hold up behind the scenes.",
        image: "/images/gray fuji.jpg",
    },
    {
        label: "Interned",
        title: "MeldCX Philippines",
        timeline: "Feb 2026 – May 2026",
        story: "My internship at MeldCX Philippines was my first look at how software gets built outside of school — company tasks, real deadlines, and a team to build with. I migrated a React project from Create React App to Vite, updating its build configuration and workflows, collaborated with the developers through Git and GitHub, and took on tasks across the frontend and the backend, debugging included.",
        image: "/images/gray lantern 1.jpg",
    },
    {
        label: "Personal",
        title: "Personal projects",
        timeline: "May 2026 – present",
        story: "On my own time I build ideas end to end, from the database through to the design. So far that has meant landing pages and dashboards that work across mobile, tablet and desktop; admin authentication, business workflows and the infrastructure to deploy them; an AI chatbot; and third-party APIs such as Google sign-in.",
        image: "/images/gray lantern 2.jpg",
    },
    {
        label: "Freelance work",
        title: "Junior Web Developer",
        timeline: "Aug 2026 – Nov 2026",
        story: "Freelance work as a junior web developer, building and testing the features the senior developer assigned me. I created a landing page, carried out redesigns for better usability, fixed bugs and faulty UIs, improved the experience on desktop and mobile, and made the current designs consistent with their own styles.",
        image: "/images/gray umbrella.jpg",
    },
];

/* ------------------------------------------------------------------
   Works — the sites I have built and am happy to show, newest first. The
   first is the one the home page's works section holds up.

   `image` is the site's hero as a visitor first sees it on a desktop: a
   capture of the top of its home page at 1440×900 (16:10), saved under
   `public/images/works/`; `imageMobile` the same on a phone, at 430×932,
   which is what a phone shows. `status` is "live" once the site is open for
   real, or "testing" while it is up to look round but not yet open — the
   corner of the works page says which.
   ------------------------------------------------------------------ */

export type Work = {
    title: string;
    url: string;
    description: string;
    image: string;
    imageMobile: string;
    status: "live" | "testing";
};

export const works: Work[] = [
    {
        title: "K4 Threads",
        url: "https://k4threads.vercel.app",
        description:
            "An online store for a faith-rooted streetwear label — a catalog of its drops, a size guide, search, a cart and customer accounts, made to feel as deliberate as the clothes.",
        image: "/images/works/k4threads.jpg",
        imageMobile: "/images/works/k4threads-mobile.jpg",
        status: "testing",
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
   About — the facts under the bio
   ------------------------------------------------------------------ */

const getCodingYears = () => {
    const today = new Date();
    const started = new Date(2025, 1, 9); // month 0-indexed, 1 = February
    let years = today.getFullYear() - started.getFullYear();
    const hasPassed =
        today.getMonth() > started.getMonth() ||
        (today.getMonth() === started.getMonth() && today.getDate() >= started.getDate());
    if (!hasPassed) years--;
    return years < 1 ? "1" : `${years}+`;
};

/* What the line under the about bio cycles through, in this order. */
export const aboutFacts = [
    "Philippines",
    `${personal.timezone} timezone`,
    `${getCodingYears()} years of coding`,
    "Web Developer",
];
