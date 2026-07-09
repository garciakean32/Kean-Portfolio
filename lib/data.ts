export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Full-Stack Developer",
    tagline: "I build things for the web.",
    bio: "I'm a full-stack developer based in Philippines, IT graduate, turning ideas into website project. I love creating projects for a brand, and seeing the website slowly forming is something I enjoy.",
    bioExtended:
        "When I'm taking a break from coding, you'll usually find me watching animated series or playing video games. ( - ᴗ •́ )",
    email: "garcia.kean32@gmail.com",
    location: "Cagayan de Oro City, PH",
    resumeUrl: "/resume.pdf",
    social: {
        github: "https://github.com/garciakean32",
        instagram: "https://www.instagram.com/kean.garcia32",
        facebook: "https://www.facebook.com/kean.valgere.garcia.2024/photos",
    },
};

export const skills = [
    { category: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"] },
    { category: "Backend", items: ["Node.js", "Express", "PostgreSQL (via Supabase)", "REST APIs"] },
    { category: "Tools", items: ["Git", "VScode", "Vercel", "Render Dashboard"] },
];

export const projects = [
    {
        id: 1,
        title: "K4 Threads",
        description:
            "A full-stack Clothing E-commerce Platform with payment method | it has a separate Admin Website.",
        tags: ["Next.js", "PostgreSQL (via Supabase)", "Stripe/PayPal", "TypeScript"],
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/project-placeholder.png",
        featured: true,
    },
    {
        id: 2,
        title: "DeskMind AI",
        description:
            "A full-stack AI help desk platform with custom knowledge bases | it has a separate Admin Website.",
        tags: ["React", "Node.js", "MongoDB", "Tailwind"],
        liveUrl: "https://deskmind-ai.vercel.app",
        image: "/images/project-placeholder.png",
        featured: false,
    },
];

export const stats = [
    { value: "3+", label: "Years of experience" },
    { value: "2", label: "Projects delivered" },
    { value: "24", label: "Years of age" },
];