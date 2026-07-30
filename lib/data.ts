export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Web Developer",
    tagline: "I build things for the web.",
    bio: "I'm a web developer based in Philippines, IT graduate, turning ideas into website project. I love creating projects for a brand, and seeing the website slowly forming is something I enjoy.",
    bioExtended:
        "When I'm taking a break from coding, you'll usually find me watching animated series or playing video games. ( - ᴗ •́ )",
    email: "garcia.kean32@gmail.com",
    location: "Cagayan de Oro City, PH",
    resumeUrl: "/Kean Valgere E. Garcia_Resume.pdf",
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

export const journey = {
    intro:
        "I was already interacting with computers ever since I was young. It wasn't coding related back then, but it is the reason why I took Information Technology as my course in college — it was simply the closest thing to what I was already doing every day. That course is what became the beginning of my web development journey.",
    steps: [
        {
            title: "Computers came first",
            description:
                "Ever since I was young, I was already in front of a computer. Nothing about it was technical and none of it was coding — it was just the thing I spent most of my time on.",
        },
        {
            title: "So IT was the natural choice",
            description:
                "When it was time to pick a course, I didn't have to think about it much. Information Technology was the closest one to what I was already used to doing, so that's where I went.",
        },
        {
            title: "And IT led me to the web",
            description:
                "The course is what put me in front of real code, and out of everything it covered, web development is the part that stayed with me — it's been the direction I've followed since.",
        },
    ],
};

export const sideProjects = {
    intro:
        "While I was an intern in MeldCX Philippines doing the company's tasks, to further enhance my skills, I also started developing two personal projects whenever I got my free time. One is an e-commerce related website (K4 Threads), and the other is a website that builds your own AI chatbot (AskBrain) — you will see both of them in my works section below.",
    note:
        "Both of those websites have an AI chatbot integrated and shown on the bottom right, running on the AskBrain platform.",
    highlights: [
        {
            label: "Internship",
            title: "MeldCX Philippines",
            description:
                "My first taste of real work — company tasks, real deadlines, and a much better idea of how software is built outside of school.",
        },
        {
            label: "Personal project",
            title: "K4 Threads",
            description:
                "An online clothing store built end to end, from browsing products to checking out, so I could learn what a full e-commerce flow really takes.",
        },
        {
            label: "Personal project",
            title: "AskBrain",
            description:
                "A platform where you build your own chatbot, feed it your own knowledge, then share it through a link, a QR code, or embed it into a website.",
        },
    ],
};

export const projects = [
    {
        id: 1,
        title: "K4 Threads",
        description:
            "A e-commerce clothing platform designed to provide customers with a convenient and seamless online shopping experience.",
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/K4 Threads project.png",
        featured: true,
        type: "Personal Project",
    },
    {
        id: 2,
        title: "Askbrain",
        description:
            "A platform where users build their own chatbot — a brain — and feed it the knowledge it answers from. Each brain can be shared with customers through a link, a QR code, or embedded straight into a website with a script.",
        liveUrl: "https://askbrain-user.vercel.app",
        image: "/images/askbrain project.png",
        featured: true,
        type: "Personal Project",
    },
];

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