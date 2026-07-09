export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Full-Stack Developer",
    tagline: "I build things for the web.",
    bio: "I'm a full-stack developer based in Philippines, fresh IT graduate, turning ideas into website project. I love creating projects for a brand, and seeing the website slowly forming is something I enjoy.",
    bioExtended:
        "When I'm taking a break from coding, you'll usually find me watching animated series or playing video games. ( - ᴗ •́ )",
    email: "garcia.kean32@gmail.com",
    location: "Cagayan de Oro City, PH",
    resumeUrl: "/resume.pdf",
    social: {
        github: "",
        instagram: "",
        facebook: "",
    },
};

export const skills = [
    { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"] },
    { category: "Backend", items: ["Node.js", "Express", "PostgreSQL (via Supabase)", "REST APIs"] },
    { category: "Tools", items: ["Git", "Figma", "Vercel", "Render Dashboard"] },
];

export const projects = [
    {
        id: 1,
        title: "K4 Threads",
        description:
            "A full-stack Clothing E-commerce Platform, which also have a separate admin dashboard.",
        tags: ["Next.js", "PostgreSQL (via Supabase)", "Stripe/PayPal", "TypeScript"],
        liveUrl: "https://yourproject.com",
        githubUrl: "https://github.com/yourusername/project-alpha",
        image: "/images/project-placeholder.png",
        featured: true,
    },
    {
        id: 2,
        title: "DeskMind AI",
        description:
            "An e-commerce storefront with real-time inventory, custom CMS, and a blazing-fast checkout experience.",
        tags: ["React", "Node.js", "MongoDB", "Tailwind"],
        liveUrl: "https://yourproject2.com",
        githubUrl: "https://github.com/yourusername/project-beta",
        image: "/images/project-placeholder.png",
        featured: false,
    },
];

export const stats = [
    { value: "3+", label: "Years of experience" },
    { value: "2", label: "Projects delivered" },
];