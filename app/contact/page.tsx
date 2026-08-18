import type { Metadata } from "next";
import ContactPanel from "@/components/contact/ContactPanel";

export const metadata: Metadata = {
    title: "Contact",
    description:
        "Start a project with Kean Valgere E. Garcia — full-stack web developer based in Philippines.",
};

export default function ContactPage() {
    return <ContactPanel />;
}
