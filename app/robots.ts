import type { MetadataRoute } from "next";
import { personal } from "@/lib/data";

/** Everything here is public; the sitemap is named so crawlers find it. */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${personal.siteUrl}/sitemap.xml`,
    };
}
