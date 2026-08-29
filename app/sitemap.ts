import type { MetadataRoute } from "next";
import { personal } from "@/lib/data";

/** One page, one entry — the sections are anchors on it, not URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: personal.siteUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
    ];
}
