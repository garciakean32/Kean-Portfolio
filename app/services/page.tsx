import type { Metadata } from "next";
import ServicesMasthead from "@/components/services/ServicesMasthead";
import ServiceIndex from "@/components/services/ServiceIndex";
import Process from "@/components/services/Process";
import ImageBand from "@/components/shared/ImageBand";
import PageClose from "@/components/shared/PageClose";

export const metadata: Metadata = {
    title: "Services",
    description:
        "Business websites, custom web applications, full-stack development, backend and APIs, website modernization, content systems and dashboards — built by Kean Valgere E. Garcia.",
};

export default function ServicesPage() {
    return (
        <>
            <ServicesMasthead />
            <ServiceIndex />

            {/* A full-bleed pause after the last entry in the index, before
                the process picks back up — stays dark, no pin/reveal. */}
            <ImageBand
                src="/images/gray tatami mat 3.png"
                alt=""
                caption="An empty room, measured before anything is put in it"
                tone="from-paper to-paper-3"
                height="h-[46svh] min-h-[16rem] md:h-[72svh]"
            />

            <Process />

            <PageClose
                lead="Tell me what"
                trail="you need built."
                href="/contact"
                cta="Start a project"
                tone="from-paper to-paper-3"
            />
        </>
    );
}
