import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The type scale and font families are project-specific, so tailwind-merge has
 * to be told about them — otherwise it reads `text-d4` as a colour and drops it
 * whenever a real colour class is merged alongside.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["label", "meta", "body", "lead", "d1", "d2", "d3", "d4", "d5"] },
      ],
      "font-family": [{ font: ["display", "serif", "mono", "jp"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
