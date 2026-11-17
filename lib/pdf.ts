import type { PDFPageProxy, RenderTask } from "pdfjs-dist";

/**
 * The resume's page, drawn by PDF.js rather than left to the browser — most
 * phones have no PDF viewer to put in a page at all, and the ones that do
 * each draw it their own way. Fetched, with its worker, only when it is first
 * asked for, and only once.
 *
 * The `legacy` build: the main one leans on browser features only weeks old
 * (`Map.prototype.getOrInsertComputed` and the like), which a phone a year or
 * two behind does not have; this one carries them itself.
 */
let first: Promise<PDFPageProxy> | null = null;

export function pdfPage(url: string) {
    first ??= (async () => {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerPort ??= new Worker(
            new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url),
            { type: "module" }
        );
        const doc = await pdfjs.getDocument({ url: encodeURI(url) }).promise;
        return doc.getPage(1);
    })();
    // A failed fetch can be tried again next time.
    first.catch(() => {
        first = null;
    });
    return first;
}

/** Width over height of a page. */
export function pageAspect(page: PDFPageProxy) {
    const box = page.getViewport({ scale: 1 });
    return box.width / box.height;
}

/**
 * Draws `page` onto `canvas`, `width` pixels across — or fewer, if that many
 * would take the canvas past `maxPixels` in all, which is what a phone can
 * hold without trouble. Cancel the task to stop it partway.
 */
export function drawPage(page: PDFPageProxy, canvas: HTMLCanvasElement, width: number, maxPixels = 9_000_000) {
    const box = page.getViewport({ scale: 1 });
    let scale = width / box.width;
    const area = box.width * box.height * scale * scale;
    if (area > maxPixels) scale *= Math.sqrt(maxPixels / area);
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    return page.render({ canvas, viewport }) as RenderTask;
}
