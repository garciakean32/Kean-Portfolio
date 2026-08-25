import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        /* Next 16 only serves the qualities named here — anything else logs a
           warning and is refused. 85 is the site's default for photographs;
           90 is for the two project screenshots and the full-bleed bands,
           where compression artefacts in flat UI colour are visible. */
        qualities: [75, 85, 90],
    },
};

export default nextConfig;
