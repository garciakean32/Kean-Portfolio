export const personal = {
    name: "Kean Valgere E. Garcia",
    role: "Full-Stack Developer",
    tagline: "I build things for the web.",
    bio: "I'm a full-stack developer based in Philippines, IT graduate, turning ideas into website project. I love creating projects for a brand, and seeing the website slowly forming is something I enjoy.",
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

export const projects = [
    {
        id: 1,
        title: "K4 Threads",
        description:
            "A e-commerce clothing platform designed to provide customers with a convenient and seamless online shopping experience.",
        liveUrl: "https://k4threads.vercel.app",
        image: "/images/K4 Threads project.png",
        featured: true,
    },
    {
        id: 2,
        title: "Askbrain",
        description:
            "A platform where users build their own chatbot — a brain — and feed it the knowledge it answers from. Each brain can be shared with customers through a link, a QR code, or embedded straight into a website with a script.",
        liveUrl: "https://askbrain-user.vercel.app",
        image: "/images/askbrain project.png",
        featured: true,
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
  { value: "2", label: "Projects delivered" },
  { value: `${getAge()}`, label: "Years of age" },
];