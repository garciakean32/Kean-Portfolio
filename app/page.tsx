"use client";

import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Journey from "@/components/sections/Journey";
import SideProjects from "@/components/sections/SideProjects";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Journey />
      <SideProjects />
      <Projects />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
}