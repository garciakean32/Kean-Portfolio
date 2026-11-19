"use client";

import { gsap } from "gsap";
import { type RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import {
    GLASS_BEND,
    GLASS_FROST,
    GLASS_LENS_FOLLOW,
    GLASS_LENS_R,
    GLASS_PAD,
    GLASS_RIM,
    GLASS_SPLIT,
    GLASS_SWEEP_TIME,
    GLASS_WAVE_MAX,
    GLASS_WAVE_REACH,
    GLASS_WAVE_SHARE,
} from "@/lib/glass";
import { cn } from "@/lib/utils";

type Rect = { left: number; top: number; width: number; height: number };

/** How far along the still is, moved by whatever opens it. */
export type StillState = {
    /** whether the photo is drawn at all, 0 or 1 */
    on: number;
    /** the card come forward, as itself — its glass and all — to its full size, 0..1 */
    grow: number;
    /** gone over to its side of the open card, 0..1 */
    spread: number;
    /** the same photo spread soft and dark behind the glass, 0..1 */
    fill: number;
    /** the pane of glass across the band, 0..1 */
    pane: number;
    /** the house lights down round it, 0..1 — see `LIGHTS_DOWN` */
    dark: number;
};

/** The card it comes out of, in the screen's CSS pixels — and, as the reel
    has them, when the light crossing it set off and how strong the lens over
    it is, for the still to carry them on. */
export type StillCard = Rect & { radius: number; sweepFrom?: number; lens?: number };

export type GlassStillHandle = {
    state: StillState;
    from: (card: StillCard) => void;
};

/* Below this width the still is laid out for a phone. */
const PHONE_WIDTH = 768;

/* A photo's shape until it has loaded, width over height: the card's. And
   its corners, in its own heights, should the card it comes out of not say. */
const CARD_SHAPE = 4 / 5;
const CORNER = 0.03;

/* How dark the photo spread behind the glass is, how much darker the glass
   makes it again, so white words read on it, and how soft it is — how many
   levels of the photo's own mipmaps off it is read. */
const FILL_DIM = 0.4;
const PANE_DIM = 0.45;
const FILL_SOFT = 6;

/* The page round the card, as its frame of glass bends it: white, going down
   to the house lights' own #1a1a1a as they go down. */
const LIGHTS_DOWN = 0x1a / 255;

/* How much sharper than the reel reads it, in levels of its mipmaps, the
   photo is read once it is out: drawn smaller than it is, it stays crisp
   rather than going soft. */
const SHARPEN = 0.75;

/* The drawing buffer's sharpness at most: the reel's own, so the card is as
   sharp come out of it as it was in it. */
const MAX_DPR = 2;

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* Everything here is in the drawing buffer's pixels, y down. Colours come
   out premultiplied: where nothing is drawn, the page shows through. */
const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uAspect;
uniform vec2 uRes;
uniform float uPx;
uniform vec4 uBand;
uniform vec4 uPhoto;
uniform float uPhotoR;
uniform vec4 uCrop;
uniform float uSharp;
uniform float uOn;
uniform float uFill;
uniform float uPaneA;
uniform vec3 uGround;
uniform float uTime;
uniform float uShimmer;
uniform float uSweep;
uniform float uWave;
uniform float uWaveLen;
uniform vec3 uLens;
uniform float uLensR;
uniform float uPad;
uniform float uRim;
uniform float uBend;
uniform float uSplit;
uniform float uFrost;
varying vec2 vUv;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Squared by hand: pow() is undefined for a negative base on some GPUs.
float sq(float x) { return x * x; }

// The photo at a point of it, v down from its top, read soft levels off.
vec3 photo(vec2 uv, float soft) {
  return texture2D(uMap, vec2(uv.x, 1.0 - uv.y), soft).rgb;
}

// One premultiplied colour over another.
vec4 over(vec4 top, vec4 under) {
  return vec4(top.rgb + under.rgb * (1.0 - top.a), top.a + under.a * (1.0 - top.a));
}

float inBand(vec2 p) {
  vec2 inside = step(uBand.xy, p) * step(p, uBand.zw);
  return inside.x * inside.y;
}

// The band behind the glass: the photo spread across it, covering it about
// its middle, soft and dark.
vec4 backdrop(vec2 p) {
  float band = inBand(p) * uFill;
  if (band <= 0.0) return vec4(0.0);
  vec2 size = max(uBand.zw - uBand.xy, vec2(1.0));
  vec2 q = (p - uBand.xy) / size;
  float ba = size.x / size.y;
  vec2 s = uAspect > ba ? vec2(ba / uAspect, 1.0) : vec2(1.0, uAspect / ba);
  vec2 uv = 0.5 + (q - 0.5) * s;
  vec3 c = photo(uv + vec2(0.012, 0.0), ${FILL_SOFT.toFixed(1)}) + photo(uv - vec2(0.012, 0.0), ${FILL_SOFT.toFixed(1)}) +
           photo(uv + vec2(0.0, 0.012), ${FILL_SOFT.toFixed(1)}) + photo(uv - vec2(0.0, 0.012), ${FILL_SOFT.toFixed(1)});
  return vec4(c * (${FILL_DIM.toFixed(2)} / 4.0) * band, band);
}

// The photo's middle; and its frame of glass — how far a point is out past
// the frame's outer edge, uPad out from the photo all the way round.
vec2 centre() { return uPhoto.xy + uPhoto.zw * 0.5; }
float frame(vec2 p) {
  return sdRoundBox(p - centre(), uPhoto.zw * 0.5 + uPad, uPhotoR + uPad);
}

// What is behind the photo: the page as it is round the card — inside its
// frame only, for the glass to bend; anywhere else the page itself shows —
// the photo spread soft and dark across the band over that, and the pane of
// glass over all of it, frosting and darkening what is behind it, a little
// light caught along its top.
vec4 behind(vec2 p) {
  vec4 b = backdrop(p);
  float g = (1.0 - smoothstep(-uPx, 0.0, frame(p))) * uOn;
  vec4 c = over(b, vec4(uGround * g, g));
  float pane = uPaneA * inBand(p);
  if (pane > 0.0) {
    float y = clamp((p.y - uBand.y) / max(uBand.w - uBand.y, 1.0), 0.0, 1.0);
    c = mix(c, vec4(b.rgb * ${PANE_DIM.toFixed(2)} + vec3(0.03) * (1.0 - y), 1.0), pane);
  }
  return c;
}

// The photo itself, cropped to its box so it is never stretched, as a
// premultiplied colour.
vec4 picture(vec2 p) {
  if (uOn <= 0.0) return vec4(0.0);
  float sd = sdRoundBox(p - centre(), uPhoto.zw * 0.5, uPhotoR);
  float cover = (1.0 - smoothstep(-uPx, uPx * 0.5, sd)) * uOn;
  if (cover <= 0.0) return vec4(0.0);
  vec2 q = clamp((p - uPhoto.xy) / uPhoto.zw, 0.0, 1.0);
  return vec4(photo(mix(uCrop.xy, uCrop.zw, q), uSharp) * cover, cover);
}

vec4 view(vec2 p) { return over(picture(p), behind(p)); }

// The view a little frosted: r pixels of soft round about it.
vec4 frosted(vec2 p, float r) {
  if (r < 0.3) return view(p);
  return (view(p) + view(p + vec2(r, 0.0)) + view(p - vec2(r, 0.0)) +
          view(p + vec2(0.0, r)) + view(p - vec2(0.0, r))) / 5.0;
}

void main() {
  vec2 p = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
  vec2 pc = centre();
  // From the photo's middle, y up: the reel's own measure of its card, so the
  // glass on it goes on just as it was there.
  vec2 fp = vec2(p.x - pc.x, pc.y - p.y);
  vec4 c = view(p);

  // The slow liquid wave over the photo, the reel's own — the picture bending
  // with it and its rises catching a little light. The words are not in it,
  // so nothing of them bends.
  if (uWave > 0.0 && uOn > 0.0) {
    float held = 1.0 - smoothstep(0.0, 3.0 * uPx, sdRoundBox(p - pc, uPhoto.zw * 0.5, uPhotoR));
    if (held > 0.0) {
      vec2 cp = fp / uWaveLen;
      vec2 swell = vec2(
        sin(cp.y * 3.6 + uTime * 0.45) + 0.6 * sin(cp.x * 2.8 - uTime * 0.34 + cp.y * 1.5),
        cos(cp.x * 3.4 - uTime * 0.4) + 0.6 * cos(cp.y * 2.6 + uTime * 0.3 - cp.x * 1.3)
      );
      vec4 water = view(p + vec2(swell.x, -swell.y) * uWave);
      water.rgb += vec3(0.035 * (swell.x + swell.y) / 3.2) * water.a;
      c = mix(c, water, held);
    }
  }

  // The light that was crossing the card as it was opened, carried on across
  // it, the reel's own: a band of glass on a slant, gliding from its left
  // edge to its right, bending what is under it a little each way and
  // catching a little light.
  if (uSweep > 0.0 && uSweep < 1.0 && uOn > 0.0) {
    vec2 hb = uPhoto.zw * 0.5;
    float inside = 1.0 - smoothstep(-1.5 * uPx, 0.5 * uPx, sdRoundBox(p - pc, hb, uPhotoR));
    float u = (fp.x - fp.y * 0.45) / (2.0 * hb.x) + 0.5;
    float lean = 0.45 * hb.y / (2.0 * hb.x) + 0.18;
    float d = (u - mix(-lean, 1.0 + lean, uSweep)) / 0.12;
    if (inside > 0.0 && abs(d) < 1.0) {
      float body = cos(d * 1.5707963);
      // the reel's slant, y down here
      vec2 dir = normalize(vec2(1.0, 0.45));
      vec2 off = dir * sin(d * 3.14159265) * 5.0 * uPx;
      vec4 g = view(p + off);
      vec4 b = vec4(view(p + off * 1.4).r, g.g, view(p + off * 0.6).b, g.a);
      b.rgb += vec3(0.08 * body * body) * g.a;
      c = mix(c, b, inside * body);
    }
  }

  // Its frame of glass, the reel's own and drawn as the reel draws it: a
  // rounded bead of glass standing out round it, whose rim bends what is
  // under it outward and splits it into red and blue, frosted a little,
  // reaching a few pixels in over the photo; and one fine, quiet grey line
  // along its outer edge, with a slow glint going round it.
  if (uOn > 0.0) {
    vec2 q = p - pc;
    vec2 hs = uPhoto.zw * 0.5 + uPad;
    float rad = uPhotoR + uPad;
    float sd = sdRoundBox(q, hs, rad);
    if (sd < 0.0 && sd > -uRim) {
      float bead = sin(-sd / uRim * 3.14159265);
      vec2 e = vec2(1.0, 0.0);
      vec2 n = normalize(vec2(
        sdRoundBox(q + e.xy, hs, rad) - sdRoundBox(q - e.xy, hs, rad),
        sdRoundBox(q + e.yx, hs, rad) - sdRoundBox(q - e.yx, hs, rad)
      ) + 1e-6);
      vec2 off = -n * bead * uBend;
      float fr = uFrost * bead;
      vec4 mid = frosted(p + off, fr);
      c = vec4(frosted(p + off * (1.0 + uSplit), fr).r, mid.g, frosted(p + off * (1.0 - uSplit), fr).b, mid.a);
      float edge = exp(-sq((sd + uPx) / (0.85 * uPx)));
      float glint = mix(1.0, 0.45 + 0.55 * sin(atan(fp.y, fp.x) * 3.0 - uTime * 1.1), uShimmer);
      c.rgb = mix(c.rgb, vec3(0.64, 0.66, 0.69) * c.a, edge * 0.45 * glint);
    }
  }

  // The pane's edge along its top and its bottom, where the bars meet it —
  // its sides are the screen's own: a rim that bends what is under it in and
  // splits it into red and blue, frosted a little, and one fine light line
  // with a slow glint going along.
  if (uPaneA > 0.001) {
    vec2 bc = (uBand.xy + uBand.zw) * 0.5;
    float dy = p.y - bc.y;
    float sd = abs(dy) - (uBand.w - uBand.y) * 0.5;
    if (sd < 0.0 && sd > -uRim) {
      float bead = sin(-sd / uRim * 3.14159265);
      vec2 off = vec2(0.0, -sign(dy)) * bead * uBend;
      float fr = uFrost * bead;
      vec3 bent = vec3(
        view(p + off * (1.0 + uSplit) + vec2(fr, 0.0)).r,
        view(p + off).g,
        view(p + off * (1.0 - uSplit) - vec2(fr, 0.0)).b
      );
      c.rgb = mix(c.rgb, bent, bead * 0.85 * uPaneA);
      float edge = exp(-sq((sd + uPx) / (0.85 * uPx)));
      float glint = 0.45 + 0.55 * sin(atan(dy, p.x - bc.x) * 3.0 - uTime * 1.1);
      c.rgb = mix(c.rgb, vec3(0.86, 0.9, 0.96) * c.a, edge * 0.32 * glint * uPaneA);
    }
  }

  // The lens under the mouse, over the photo: what is under it a little
  // closer, its rim pulling in and splitting the colours.
  if (uLens.z > 0.001) {
    vec2 lp = p - uLens.xy;
    float d = length(lp) / uLensR;
    if (d < 1.0) {
      vec2 dir = lp / max(length(lp), 1e-4);
      float rim = smoothstep(0.55, 1.0, d);
      vec2 sp = uLens.xy + lp * 0.82 - dir * rim * rim * uLensR * 0.18;
      float split = rim * uLensR * 0.02;
      vec3 lc = vec3(view(sp + dir * split).r, view(sp).g, view(sp - dir * split).b) + vec3(0.05 * (1.0 - d)) * c.a;
      c.rgb = mix(c.rgb, lc, (1.0 - smoothstep(0.96, 1.0, d)) * uLens.z);
    }
  }

  gl_FragColor = c;
}
`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
});
const inRect = (x: number, y: number, r: Rect) =>
    x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;

/**
 * The engine: one canvas over the whole screen, drawing the open card as a
 * film still behind glass. Returns null where WebGL cannot be had.
 */
function createStill(
    mount: HTMLElement,
    o: { srcs: string[]; band: () => HTMLElement | null; photo: () => HTMLElement | null }
) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
        return null;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    mount.appendChild(canvas);

    // Every stop's photo, kept as it comes — sRGB in and sRGB out — and
    // loaded at once, so the next is ready the moment it is wanted.
    const blank = new THREE.DataTexture(new Uint8Array([17, 17, 17, 255]), 1, 1);
    blank.needsUpdate = true;
    const loader = new THREE.TextureLoader();
    const pictures = o.srcs.map((src) => {
        const picture = { tex: blank as THREE.Texture, aspect: CARD_SHAPE };
        if (src) {
            loader.load(src, (tex) => {
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                const img = tex.image as { width: number; height: number };
                picture.aspect = img.width / img.height;
                picture.tex = tex;
            });
        }
        return picture;
    });
    let active = 0;

    const uniforms = {
        uMap: { value: blank as THREE.Texture },
        uAspect: { value: CARD_SHAPE },
        uRes: { value: new THREE.Vector2(1, 1) },
        uPx: { value: dpr },
        uBand: { value: new THREE.Vector4() },
        uPhoto: { value: new THREE.Vector4() },
        uPhotoR: { value: 0 },
        uCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
        uSharp: { value: 0 },
        uOn: { value: 0 },
        uFill: { value: 0 },
        uPaneA: { value: 0 },
        uGround: { value: new THREE.Vector3(1, 1, 1) },
        uTime: { value: 0 },
        uShimmer: { value: reduced ? 0 : 1 },
        uSweep: { value: -1 },
        uWave: { value: 0 },
        uWaveLen: { value: 1 },
        uLens: { value: new THREE.Vector3() },
        uLensR: { value: GLASS_LENS_R * dpr },
        uPad: { value: GLASS_PAD * dpr },
        uRim: { value: GLASS_RIM * dpr },
        uBend: { value: GLASS_BEND * dpr },
        uSplit: { value: GLASS_SPLIT },
        uFrost: { value: GLASS_FROST * dpr },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    // Drawn straight onto the cleared canvas, colours and all as they come:
    // they are premultiplied already, which the page composites them as.
    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        blending: THREE.NoBlending,
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let W = 1;
    let H = 1;
    const fit = () => {
        W = Math.max(1, mount.clientWidth);
        H = Math.max(1, mount.clientHeight);
        renderer.setSize(W, H, false);
        uniforms.uRes.value.set(W * dpr, H * dpr);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(mount);

    const state: StillState = { on: 0, grow: 0, spread: 0, fill: 0, pane: 0, dark: 0 };
    let card: Rect & { radius: number } = { left: 0, top: 0, width: 0, height: 0, radius: 0 };
    // When the light crossing the card set off, while one is crossing it.
    let sweepAt: number | null = null;

    // The lens: under the mouse, over the photo.
    const lens = { x: 0, y: 0, tx: 0, ty: 0, a: 0, on: false };
    const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = mount.getBoundingClientRect();
        lens.tx = e.clientX - r.left;
        lens.ty = e.clientY - r.top;
        if (!lens.on && lens.a < 0.01) {
            lens.x = lens.tx;
            lens.y = lens.ty;
        }
        lens.on = true;
    };
    const onLeave = () => {
        lens.on = false;
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);

    // Where things are, in the mount's own pixels: an element as it is laid
    // out, its own movement left out — or as it is drawn.
    const laidOut = (el: HTMLElement, base: DOMRect): Rect => {
        const parent = el.offsetParent instanceof HTMLElement ? el.offsetParent.getBoundingClientRect() : base;
        return {
            left: parent.left - base.left + el.offsetLeft,
            top: parent.top - base.top + el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
        };
    };
    const drawnAt = (el: HTMLElement, base: DOMRect): Rect => {
        const r = el.getBoundingClientRect();
        return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
    };

    let drawn = false;
    let last = performance.now();

    const tick = () => {
        const now = performance.now();
        const dt = Math.min(64, now - last);
        last = now;
        const k = (ease: number) => 1 - Math.pow(1 - ease, dt / (1000 / 60));

        if (state.on <= 0) {
            if (drawn) {
                renderer.clear();
                drawn = false;
            }
            return;
        }
        const bandEl = o.band();
        if (!bandEl) return;
        const base = mount.getBoundingClientRect();
        const phone = W < PHONE_WIDTH;
        const band = drawnAt(bandEl, base);
        const picture = pictures[active] ?? pictures[0];
        const from: Rect = { left: card.left - base.left, top: card.top - base.top, width: card.width, height: card.height };

        // Where the photo is. The card first comes forward as itself — its
        // own shape, the reel's own crop, its glass and all — to its full
        // size in the middle of the band; then, wider than a phone, it goes
        // over to its side, to where the page lays it out. On a phone it
        // comes straight out to its box, wherever the sheet has left it.
        const photoEl = o.photo();
        const laid = photoEl ? laidOut(photoEl, base) : null;
        const end = laid && laid.width > 1 && laid.height > 1 ? laid : from;
        let photoAt: Rect;
        if (phone) {
            photoAt = lerpRect(from, end, state.grow);
        } else {
            const middle = {
                left: band.left + (band.width - end.width) / 2,
                top: band.top + (band.height - end.height) / 2,
                width: end.width,
                height: end.height,
            };
            photoAt = lerpRect(lerpRect(from, middle, state.grow), end, state.spread);
        }
        photoAt.width = Math.max(1, photoAt.width);
        photoAt.height = Math.max(1, photoAt.height);

        // The photo cropped to the shape of its box, about its middle, so at
        // no point is it stretched — its corners rounding with its size, as
        // the card's would, come nearer. On a phone, as it fills the screen,
        // its frame comes in to its edges, the rim of glass running along
        // them inside the screen rather than out past it, and its corners
        // square off with the screen's.
        const r = photoAt.width / photoAt.height;
        const cu = picture.aspect > r ? r / picture.aspect : 1;
        const cv = picture.aspect > r ? 1 : picture.aspect / r;
        const corner = (card.height > 0 ? card.radius / card.height : CORNER) * photoAt.height;

        uniforms.uMap.value = picture.tex;
        uniforms.uAspect.value = picture.aspect;
        uniforms.uBand.value.set(band.left * dpr, band.top * dpr, (band.left + band.width) * dpr, (band.top + band.height) * dpr);
        uniforms.uPhoto.value.set(photoAt.left * dpr, photoAt.top * dpr, photoAt.width * dpr, photoAt.height * dpr);
        uniforms.uPhotoR.value = (phone ? lerp(corner, 0, state.grow) : corner) * dpr;
        uniforms.uPad.value = GLASS_PAD * (phone ? 1 - state.grow : 1) * dpr;
        uniforms.uCrop.value.set(0.5 - cu / 2, 0.5 - cv / 2, 0.5 + cu / 2, 0.5 + cv / 2);
        uniforms.uSharp.value = -SHARPEN * state.grow;
        uniforms.uOn.value = state.on;
        uniforms.uFill.value = state.fill;
        // No pane on a phone: the sheet over the rest is solid.
        const pane = phone ? 0 : state.pane;
        uniforms.uPaneA.value = pane;
        uniforms.uGround.value.setScalar(1 - (1 - LIGHTS_DOWN) * state.dark);

        // The card's own wave, the reel's, all the way out and back.
        const side = Math.max(photoAt.width, photoAt.height) / 2;
        uniforms.uWave.value = reduced ? 0 : Math.min(GLASS_WAVE_MAX, side * GLASS_WAVE_SHARE) * dpr;
        uniforms.uWaveLen.value = Math.max(side, GLASS_WAVE_REACH) * dpr;
        uniforms.uTime.value = now / 1000;
        const crossed = sweepAt === null ? -1 : (now - sweepAt) / 1000 / GLASS_SWEEP_TIME;
        if (crossed >= 1) sweepAt = null;
        uniforms.uSweep.value = reduced || crossed <= 0 || crossed >= 1 ? -1 : 0.5 - 0.5 * Math.cos(Math.PI * crossed);

        // The lens, over the photo wherever the mouse is on it.
        const want = lens.on && !phone && inRect(lens.tx, lens.ty, photoAt);
        const follow = reduced ? 1 : k(GLASS_LENS_FOLLOW);
        lens.x += (lens.tx - lens.x) * follow;
        lens.y += (lens.ty - lens.y) * follow;
        lens.a += ((want ? 1 : 0) - lens.a) * k(0.15);
        uniforms.uLens.value.set(lens.x * dpr, lens.y * dpr, lens.a);

        renderer.render(scene, camera);
        drawn = true;
    };
    gsap.ticker.add(tick);

    return {
        state,
        show: (index: number) => {
            active = index;
        },
        from: (rect: StillCard) => {
            card = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: rect.radius };
            // Coming out of the card, the still takes on the light crossing
            // it and the lens over it, so neither stops; going back into it,
            // it keeps its own.
            if (state.on > 0) return;
            const crossed =
                rect.sweepFrom === undefined ? -1 : (performance.now() - rect.sweepFrom) / 1000 / GLASS_SWEEP_TIME;
            sweepAt = crossed > 0 && crossed < 1 && rect.sweepFrom !== undefined ? rect.sweepFrom : null;
            lens.a = rect.lens ?? 0;
            lens.x = lens.tx;
            lens.y = lens.ty;
        },
        destroy: () => {
            gsap.ticker.remove(tick);
            observer.disconnect();
            window.removeEventListener("pointermove", onMove);
            document.documentElement.removeEventListener("mouseleave", onLeave);
            pictures.forEach((picture) => {
                if (picture.tex !== blank) picture.tex.dispose();
            });
            blank.dispose();
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            canvas.remove();
        },
    };
}

/**
 * An open card as a film still behind glass, over the whole screen. The card
 * clicked comes forward as itself — its own shape and crop, never stretched,
 * and its frame of glass, the reel's own, the wave going on over it — to its
 * full size; then, wider than a phone, it goes over to its side of the open
 * card, still a card of its own, and a pane of glass comes up behind it
 * across the whole band, edge to edge, the same photo spread soft and dark
 * behind that. The pane frosts and darkens what is behind it, for the words
 * over it to read on, its own edge bending and splitting what it passes over
 * the way the reel's glass does, and a lens follows the mouse over the photo.
 * The words are not in it, so nothing of them ever bends. On a phone the
 * photo comes out to fill the screen, then gives way above a solid sheet
 * as it rises — see `photoRef`.
 *
 * Its frame bends the page round it as it is — white, or darkened by the
 * house lights, as `dark` says — and it carries on the light and the lens
 * the card had, so the card leaves the reel and goes back into it with its
 * glass on, never a seam between the two.
 *
 * `bandRef` is the box it is drawn across, and `photoRef` the photo's box as
 * the page lays it out. Whatever opens it moves it through `controlRef` —
 * see `StillState`. `onReady` is told whether WebGL could be had at all.
 */
export function GlassStill({
    srcs,
    active,
    bandRef,
    photoRef,
    controlRef,
    onReady,
    className,
}: {
    srcs: string[];
    active: number;
    bandRef: RefObject<HTMLElement | null>;
    photoRef: RefObject<HTMLElement | null>;
    controlRef?: RefObject<GlassStillHandle | null>;
    onReady?: (live: boolean) => void;
    className?: string;
}) {
    const mount = useRef<HTMLDivElement>(null);
    const engine = useRef<ReturnType<typeof createStill>>(null);
    const latest = useRef({ active, onReady });
    useEffect(() => {
        latest.current = { active, onReady };
    });

    useEffect(() => {
        const el = mount.current;
        if (!el) return;
        const still = createStill(el, { srcs, band: () => bandRef.current, photo: () => photoRef.current });
        engine.current = still;
        still?.show(latest.current.active);
        latest.current.onReady?.(Boolean(still));
        if (controlRef) controlRef.current = still ? { state: still.state, from: still.from } : null;
        return () => {
            still?.destroy();
            engine.current = null;
            if (controlRef) controlRef.current = null;
        };
    }, [srcs, bandRef, photoRef, controlRef]);

    useEffect(() => {
        engine.current?.show(active);
    }, [active]);

    return <div ref={mount} aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)} />;
}
