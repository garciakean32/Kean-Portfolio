import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    images: {
        /* Next 16 only serves the qualities named here — anything else logs a
           warning and is refused. 85 is the site's default for photographs;
           90 is for the two project screenshots and the full-bleed bands,
           where compression artefacts in flat UI colour are visible. */
        qualities: [75, 85, 90],
        /* AVIF first, WebP behind it. The sources in `public/images` are
           already sized for the largest slot each one fills, so the optimiser
           is only re-encoding — and AVIF is worth roughly another third off
           the photographs at the same quality. */
        formats: ["image/avif", "image/webp"],
        /* The sources are content-addressed by the optimiser and none of them
           change without a deploy, so there is nothing to be gained from
           re-optimising them every few minutes. */
        minimumCacheTTL: 60 * 60 * 24 * 365,
        /* Dev only: the optimiser keeps a variant per source URL and never
           restats the file behind it, so replacing an image in place under the
           same name keeps serving the old pixels — and only at the widths that
           happen to be cached, which reads as "broken on some screen sizes".
           Lowering the TTL does not help; the entry is held for the life of the
           server. Serving the file unoptimised in dev means an edit shows up on
           the next reload. Production still goes through AVIF/WebP as before. */
        unoptimized: process.env.NODE_ENV !== "production",
    },
};

export default nextConfig;
