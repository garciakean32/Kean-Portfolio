import type { Metadata } from "next";
import ProjectsMasthead from "@/components/projects/ProjectsMasthead";
import CaseStudy from "@/components/projects/CaseStudy";
import ProjectsClose from "@/components/projects/ProjectsClose";
import { projects } from "@/lib/data";

export const metadata: Metadata = {
    title: "Projects",
    description:
        "Case notes on K4 Threads and AskBrain — two live web products built end to end by Kean Valgere E. Garcia, from database through to interface.",
};

export default function ProjectsPage() {
    return (
        <>
            <ProjectsMasthead />

            {projects.map((project, i) => (
                <CaseStudy key={project.id} project={project} position={i} />
            ))}

            {/* Stays dark, picking up where the last study leaves off — no
                light-panel flip at the close on this page. */}
            <ProjectsClose />
        </>
    );
}
