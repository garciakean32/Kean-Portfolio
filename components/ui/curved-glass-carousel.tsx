"use client";

import { gsap } from "gsap";
import Image from "next/image";
import { type RefObject, useEffect, useRef, useState } from "react";
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

export type CurvedGlassItem = { src: string; alt: string };

/** The centred card, in the carousel's own CSS pixels. */
export type CardRect = { left: number; top: number; width: number; height: number };

/** How the other cards go when the centred one is opened over, or come back
    when it is closed. */
export type CurvedGlassLeave = { delay: number; duration: number; ease: string };

export type CurvedGlassHandle = {
    next: () => void;
    previous: () => void;
    /** The centred card is being opened over: the others part away from it,
        the glass goes, and nothing moves the carousel until `release`. */
    hold: (leave: CurvedGlassLeave) => void;
    /** …and closed again: `back.delay` seconds on, the others come back
        round it over `back.duration` seconds on `back.ease` — from just
        out of sight, so the whole of their return is seen. */
    release: (back: CurvedGlassLeave) => void;
    /** A card on at once — while held, out of sight under what is open. */
    shift: (direction: number) => void;
    /** Where the centred card is drawn right now, come forward or not, and
        how round its corners are — and, for what is laid over it to carry
        them on, when the light crossing it set off (`performance.now()`
        time) and how strong the lens over it is, 0..1. `resting`: its size
        at rest instead, not come forward — where `release` lands it. */
    rect: (resting?: boolean) => CardRect & { radius: number; sweepFrom: number; lens: number };
    /** The centred card is being drawn by something laid over it: the reel
        leaves it out until told otherwise — its glass too, which what is
        laid over it draws as well — so there are never two. */
    cover: (on: boolean) => void;
    /** Whether it is at rest on a card: let go, and neither turning nor
        being dragged. */
    resting: () => boolean;
};

/* The cards' shape, width over height, unless told otherwise: a website's
   hero on a desktop. A picture of another shape is cropped to the card from
   the top, the way a page is first seen. */
const ASPECT = 16 / 10;

/* The centred card: no more than this share of the row's width — a tablet
   and a phone give it more — and as tall as the row allows, with room kept
   for it to come forward, and for the glass round it, without leaving it. */
const CARD_WIDTH = 0.62;
const CARD_WIDTH_TABLET = 0.8;
const CARD_WIDTH_PHONE = 0.72;
const CARD_ROOM = 6;
/* Its corners, in its own heights. */
const CORNER = 0.03;

/* The track the cards stand on: its radius, in widths of the centred card;
   how far apart two cards stand along it, in the same; how far a card a step
   round rises, in heights — the curve seen from a little above, so the
   centred card is the nearest and the lowest — and how much each tips to
   follow the curve, per radian round it. */
const RADIUS = 2.2;
const SPACING = 1.22;
const RISE = 0.11;
const TIP = 0.12;
/* The reel: the same cards on a drum that turns up and down instead — the
   centred card no taller than this share of the row, the ones above and
   below it close by and tilting back as they go round a tighter drum, and
   bowing out a little to the right, in widths, as if it were seen from a
   little to its left. Turned on with `vertical`. */
const REEL_HEIGHT = 0.54;
const REEL_HEIGHT_PHONE = 0.58;
const REEL_RADIUS = 1.6;
const REEL_SPACING = 1.06;
const REEL_BOW = 0.08;
/* How far round, in radians, the others turn away while the centred card is
   held open — off the screen. */
const PART = 0.9;
/* A narrow lens, so the curve reads without the near card ballooning. */
const FOV = 24;
/* Cards placed either side of the centre, the ones beyond the screen's edge
   included, so a card is never seen arriving from nowhere. */
const REACH = 3;

/* The sides, out of focus: how hard at most, in CSS pixels, how far past the
   centred card's edge it takes to come in fully, as a share of the row's
   width, and how far toward the white of the page they fade. */
const BLUR = 13;
const FAR = 0.2;
const HAZE = 0.42;

/* The glass frame round the centred card, the same all the way round —
   corners and sides alike: how far out from the card it stands, the width
   of its rim — reaching only a few pixels in over the card itself — how far
   the rim bends what is under it, how far apart it splits the red from the
   blue, as a share of the bend, and how far it frosts what it bends, so that
   text near an edge reads as glass rather than as doubled. In CSS pixels. */
const FRAME_PAD = GLASS_PAD;
const FRAME_RIM = GLASS_RIM;
const FRAME_BEND = GLASS_BEND;
const SPLIT = GLASS_SPLIT;
const FROST = GLASS_FROST;

/* The slow liquid wave over the centred card. A swell is measured against
   the card's longer half-side, but never one shorter than WAVE_REACH, so a
   narrow phone card gets one long, gentle swell rather than a crowd of tight
   ones; and it moves the picture WAVE_SHARE of that half-side, never more
   than WAVE_MAX — a bend you can see without the picture losing its shape.
   In CSS pixels. */
const WAVE_SHARE = GLASS_WAVE_SHARE;
const WAVE_MAX = GLASS_WAVE_MAX;
const WAVE_REACH = GLASS_WAVE_REACH;

/* The lens under the pointer, and how closely it follows. */
const LENS_R = GLASS_LENS_R;
const LENS_FOLLOW = GLASS_LENS_FOLLOW;

/* How much bigger the centred card comes forward under the mouse or a held
   finger, to say it can be opened. */
const FORWARD = 0.045;

/* The way in: how many cards' turn the row comes round from off the right
   of the screen, over how long, and how far below its place it rises from,
   in heights of the centred card. */
const ENTRY_TURN = 3.2;
const ENTRY_TIME = 1.8;
const ENTRY_RISE = 0.35;
/* How far through the way in, as a share of it, the centred card is as good
   as stopped — when `onArrive` is told, so whatever waits for it comes in as
   the card comes to rest. */
const ENTRY_SETTLE = 0.8;

/* The light that sweeps across the centred card: how long it takes to
   cross, how long the card rests before the next, and how long after a card
   arrives in the middle one crosses it. */
const SWEEP_TIME = GLASS_SWEEP_TIME;
const SWEEP_REST = 4.4;
const SWEEP_ARRIVE = 0.45;

/* How much of the way to where it is headed the row covers each 60th of a
   second; a drag's reach and a flick's; and the click that is not a drag. */
const EASE = 0.1;
const FLICK = 260;
const CLICK_SLOP = 6;
const TOUCH_CLICK_SLOP = 12;
/* Wheel: the scroll that makes a step, and the quiet that ends a gesture —
   a trackpad's coasting included — so one swipe is one card. */
const WHEEL_STEP = 30;
const WHEEL_GAP_MS = 220;
/* How near the card it is headed for, in steps, the row is at rest: under a
   pixel off on any screen. */
const REST = 0.002;

const CARD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CARD_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uReady;
uniform vec2 uCover;
uniform float uAspect;
uniform float uRadius;
uniform float uTop;
varying vec2 vUv;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float d = sdRoundBox(p, vec2(uAspect * 0.5, 0.5), uRadius);
  float aa = fwidth(d);
  float inside = 1.0 - smoothstep(-aa, aa, d);
  // A picture taller than the card is cropped from its top, or about its middle.
  float y = mix(0.5 + (vUv.y - 0.5) * uCover.y, 1.0 - (1.0 - vUv.y) * uCover.y, uTop);
  vec2 uv = vec2(0.5 + (vUv.x - 0.5) * uCover.x, y);
  vec3 col = mix(vec3(0.93), texture2D(uMap, uv).rgb, uReady);
  gl_FragColor = vec4(col, inside);
}
`;

const POST_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* Everything here is in the drawing buffer's pixels, y up. */
const POST_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec4 uCard;
uniform float uCardR;
uniform float uPad;
uniform float uRim;
uniform float uBend;
uniform float uSplit;
uniform float uBlur;
uniform float uFar;
uniform float uHaze;
uniform float uAxis;
uniform float uGlass;
uniform float uTime;
uniform float uShimmer;
uniform float uPx;
uniform float uSweep;
uniform float uWave;
uniform float uWaveLen;
uniform float uFrost;
uniform vec3 uLens;
uniform float uLensR;
varying vec2 vUv;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Squared by hand: pow() is undefined for a negative base on some GPUs.
float sq(float x) { return x * x; }

vec3 tap(vec2 px) { return texture2D(uTex, px / uRes).rgb; }

// The row as it is seen: sharp over the centred card, softer and paler out
// toward the sides — or, on a reel, toward the top and the bottom — as if
// they stood far behind it.
vec3 view(vec2 px) {
  float f = smoothstep(0.0, uFar, mix(abs(px.x - uCard.x) - uCard.z, abs(px.y - uCard.y) - uCard.w, uAxis));
  float r = f * uBlur;
  vec3 c = tap(px);
  if (r > 0.75) {
    vec3 acc = c;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float rr = sqrt((fi + 0.5) / 12.0) * r;
      float a = fi * 2.39996323;
      acc += tap(px + vec2(cos(a), sin(a)) * rr);
    }
    c = acc / 13.0;
  }
  return mix(c, vec3(1.0), f * uHaze);
}

// The view a little frosted: r pixels of soft round about it.
vec3 frosted(vec2 p, float r) {
  if (r < 0.3) return view(p);
  return (view(p) + view(p + vec2(r, 0.0)) + view(p - vec2(r, 0.0)) +
          view(p + vec2(0.0, r)) + view(p - vec2(0.0, r))) / 5.0;
}

void main() {
  vec2 px = vUv * uRes;
  vec3 col = view(px);
  vec2 fp = px - uCard.xy;

  // The slow liquid wave: the centred card seen through a thin sheet of
  // moving water — a swell or two across it at a time, drifting slowly, the
  // picture bending with it and its rises catching a little light. Its edge
  // rides the swell too.
  if (uWave > 0.0 && uGlass > 0.001) {
    float held = 1.0 - smoothstep(0.0, 3.0 * uPx, sdRoundBox(fp, uCard.zw, uCardR));
    if (held > 0.0) {
      vec2 cp = fp / uWaveLen;
      vec2 swell = vec2(
        sin(cp.y * 3.6 + uTime * 0.45) + 0.6 * sin(cp.x * 2.8 - uTime * 0.34 + cp.y * 1.5),
        cos(cp.x * 3.4 - uTime * 0.4) + 0.6 * cos(cp.y * 2.6 + uTime * 0.3 - cp.x * 1.3)
      );
      vec3 water = view(px + swell * uWave) + vec3(0.035 * (swell.x + swell.y) / 3.2);
      col = mix(col, water, held * uGlass);
    }
  }

  // The light sweeping across the centred card: a band of glass on a slant,
  // gliding from its left edge to its right, bending what is under it a
  // little each way and catching a little light — then gone, the card clear.
  if (uSweep > 0.0 && uSweep < 1.0 && uGlass > 0.001) {
    float inside = 1.0 - smoothstep(-1.5 * uPx, 0.5 * uPx, sdRoundBox(fp, uCard.zw, uCardR));
    // across the card on a lean, 0 at its left edge and 1 at its right —
    // starting and ending clear of its corners, however tall it is
    float u = (fp.x - fp.y * 0.45) / (2.0 * uCard.z) + 0.5;
    float lean = 0.45 * uCard.w / (2.0 * uCard.z) + 0.18;
    float d = (u - mix(-lean, 1.0 + lean, uSweep)) / 0.12;
    if (inside > 0.0 && abs(d) < 1.0) {
      float body = cos(d * 1.5707963);
      vec2 dir = normalize(vec2(1.0, -0.45));
      vec2 off = dir * sin(d * 3.14159265) * 5.0 * uPx;
      vec3 b = vec3(view(px + off * 1.4).r, view(px + off).g, view(px + off * 0.6).b);
      b += vec3(0.08 * body * body);
      col = mix(col, b, inside * body * uGlass);
    }
  }

  // The glass frame round the centred card: a rounded bead of glass whose
  // rim bends what is under it outward and splits it into red and blue —
  // evenly, the same at the corners as along the sides, frosted a little,
  // and reaching only a few pixels in over the picture, so a site's nav bar
  // along the top bends with the glass but stays readable rather than
  // doubling. The bend fades to nothing either side of the rim, so it has no
  // seam; the one line drawn is the glass's outer edge, out past the picture.
  if (uGlass > 0.001) {
    vec2 hs = uCard.zw + uPad;
    float rad = uCardR + uPad;
    float sd = sdRoundBox(fp, hs, rad);
    if (sd < 0.0 && sd > -uRim) {
      float bead = sin(-sd / uRim * 3.14159265);
      vec2 e = vec2(1.0, 0.0);
      vec2 n = normalize(vec2(
        sdRoundBox(fp + e.xy, hs, rad) - sdRoundBox(fp - e.xy, hs, rad),
        sdRoundBox(fp + e.yx, hs, rad) - sdRoundBox(fp - e.yx, hs, rad)
      ) + 1e-6);
      vec2 off = -n * bead * uBend;
      float frost = uFrost * bead;
      vec3 bent = vec3(
        frosted(px + off * (1.0 + uSplit), frost).r,
        frosted(px + off, frost).g,
        frosted(px + off * (1.0 - uSplit), frost).b
      );
      col = mix(col, bent, uGlass);

      // The outer edge: one fine, quiet grey line, with a slow glint going
      // round it.
      float edge = exp(-sq((sd + uPx) / (0.85 * uPx)));
      float glint = mix(1.0, 0.45 + 0.55 * sin(atan(fp.y, fp.x) * 3.0 - uTime * 1.1), uShimmer);
      col = mix(col, vec3(0.64, 0.66, 0.69), edge * 0.45 * glint * uGlass);
    }
  }

  // The lens under the pointer: what is under it a little closer, its rim
  // pulling in and splitting the colours. No ring drawn round it — the bend
  // itself is its edge.
  if (uLens.z > 0.001) {
    vec2 lp = px - uLens.xy;
    float d = length(lp) / uLensR;
    if (d < 1.0) {
      vec2 dir = lp / max(length(lp), 1e-4);
      float rim = smoothstep(0.55, 1.0, d);
      vec2 sp = uLens.xy + lp * 0.82 - dir * rim * rim * uLensR * 0.18;
      float split = rim * uLensR * 0.02;
      vec3 lc = vec3(view(sp + dir * split).r, view(sp).g, view(sp - dir * split).b);
      lc = mix(lc, vec3(1.0), 0.05 * (1.0 - d));
      col = mix(col, lc, (1.0 - smoothstep(0.96, 1.0, d)) * uLens.z);
    }
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

type Options = {
    items: CurvedGlassItem[];
    aspect: number;
    /* a reel, turning up and down, rather than a row */
    vertical: boolean;
    /* where a picture taller than its card is cropped from */
    crop: "top" | "center";
    entry: boolean;
    /* where the wheel turns it — the canvas, unless told otherwise */
    wheelTarget?: HTMLElement;
    onActiveChange: (index: number) => void;
    onCardRect: (rect: CardRect) => void;
    onCardClick: (index: number) => void;
    onArrive: () => void;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * The engine: the cards on a curved track, rendered to a texture, and the
 * glass and the focus drawn over that in a second pass. Returns null where
 * WebGL cannot be had.
 */
function createTrack(mount: HTMLElement, o: Options) {
    const N = o.items.length;
    if (!N) return null;
    const aspect = o.aspect;
    const vertical = o.vertical;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
        return null;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0xffffff, 1);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.cursor = "default";
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);
    const rt = new THREE.WebGLRenderTarget(1, 1);

    // The pictures, kept as they come — sRGB in and sRGB out, untouched —
    // and a pale card until each one arrives.
    const blank = new THREE.DataTexture(new Uint8Array([238, 238, 238, 255]), 1, 1);
    blank.needsUpdate = true;
    const loader = new THREE.TextureLoader();
    const pictures = o.items.map((item) => {
        const picture = { tex: blank as THREE.Texture, ready: false, cover: new THREE.Vector2(1, 1) };
        loader.load(item.src, (tex) => {
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            const img = tex.image as { width: number; height: number };
            const a = img.width / img.height;
            picture.cover.set(a > aspect ? aspect / a : 1, a > aspect ? 1 : a / aspect);
            picture.tex = tex;
            picture.ready = true;
        });
        return picture;
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    const slots = Array.from({ length: REACH * 2 + 1 }, () => {
        const uniforms = {
            uMap: { value: blank as THREE.Texture },
            uReady: { value: 0 },
            uCover: { value: new THREE.Vector2(1, 1) },
            uAspect: { value: aspect },
            uRadius: { value: CORNER },
            uTop: { value: o.crop === "top" ? 1 : 0 },
        };
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: CARD_VERTEX,
            fragmentShader: CARD_FRAGMENT,
            transparent: true,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return { mesh, material, uniforms };
    });

    const post = {
        uTex: { value: rt.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uCard: { value: new THREE.Vector4() },
        uCardR: { value: 0 },
        uPad: { value: 0 },
        uRim: { value: 0 },
        uBend: { value: 0 },
        uSplit: { value: SPLIT },
        uBlur: { value: 0 },
        uFar: { value: 1 },
        uHaze: { value: HAZE },
        uAxis: { value: vertical ? 1 : 0 },
        uGlass: { value: 0 },
        uTime: { value: 0 },
        uShimmer: { value: reduced ? 0 : 1 },
        uPx: { value: dpr },
        uSweep: { value: -1 },
        uWave: { value: 0 },
        uWaveLen: { value: 1 },
        uFrost: { value: FROST * dpr },
        uLens: { value: new THREE.Vector3() },
        uLensR: { value: 1 },
    };
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postGeometry = new THREE.PlaneGeometry(2, 2);
    const postMaterial = new THREE.ShaderMaterial({
        uniforms: post,
        vertexShader: POST_VERTEX,
        fragmentShader: POST_FRAGMENT,
    });
    postScene.add(new THREE.Mesh(postGeometry, postMaterial));

    // The layout, in CSS pixels: the camera is set so that one unit on the
    // plane of the centred card is one pixel on screen.
    let W = 1;
    let H = 1;
    let cardW = 1;
    let cardH = 1;
    let radius = 1;
    let step = 0.5;
    let rise = 0;
    let baseY = 0;
    let perStep = 1;
    let rect: CardRect = { left: 0, top: 0, width: 1, height: 1 };

    const measure = () => {
        W = Math.max(1, mount.clientWidth);
        H = Math.max(1, mount.clientHeight);
        const glass = (FRAME_PAD + CARD_ROOM) * (1 + FORWARD);
        if (vertical) {
            // Its share of the row's height — and narrow enough, come
            // forward and with its glass, to stay inside the row's width.
            // Centred: the reel bows out to one side only.
            const tall = W < 640 ? REEL_HEIGHT_PHONE : REEL_HEIGHT;
            cardH = Math.min(H * tall, (W - 2 * glass) / (1 + FORWARD) / aspect);
            cardW = cardH * aspect;
            radius = cardH * REEL_RADIUS;
            step = (cardH * REEL_SPACING) / radius;
            rise = cardW * REEL_BOW;
            baseY = 0;
        } else {
            const wide = W < 640 ? CARD_WIDTH_PHONE : W < 1024 ? CARD_WIDTH_TABLET : CARD_WIDTH;
            // Its bottom edge, come forward and with its glass, still inside
            // the row — the curve sits it a half-rise under the middle.
            cardH = Math.min((H - 2 * glass) / (1 + FORWARD + RISE), (W * wide) / aspect);
            cardW = cardH * aspect;
            radius = cardW * RADIUS;
            step = (cardW * SPACING) / radius;
            rise = cardH * RISE;
            // The centred card a little under the middle, so the cards rising
            // either side of it sit the whole curve in the middle of the row.
            baseY = -rise * 0.5;
        }

        const D = H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
        camera.aspect = W / H;
        camera.position.set(0, 0, D);
        camera.far = D + radius * 4;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
        rt.setSize(Math.round(W * dpr), Math.round(H * dpr));

        // How far across the screen — or down it — one step takes a card:
        // what a drag is measured against.
        perStep = (radius * Math.sin(step) * D) / (D + radius * (1 - Math.cos(step)));

        rect = { left: (W - cardW) / 2, top: H / 2 - baseY - cardH / 2, width: cardW, height: cardH };
        post.uRes.value.set(W * dpr, H * dpr);
        post.uCard.value.set((W / 2) * dpr, (H / 2 + baseY) * dpr, (cardW / 2) * dpr, (cardH / 2) * dpr);
        post.uCardR.value = CORNER * cardH * dpr;
        post.uPad.value = FRAME_PAD * dpr;
        post.uRim.value = FRAME_RIM * dpr;
        post.uBend.value = FRAME_BEND * dpr;
        post.uBlur.value = BLUR * dpr;
        post.uFar.value = (vertical ? H : W) * FAR * dpr;
        post.uLensR.value = LENS_R * dpr;
        const side = Math.max(cardW, cardH) / 2;
        post.uWave.value = reduced ? 0 : Math.min(WAVE_MAX, side * WAVE_SHARE) * dpr;
        post.uWaveLen.value = Math.max(side, WAVE_REACH) * dpr;
        o.onCardRect(rect);
    };
    measure();

    let scroll = 0;
    let target = 0;

    // The way in: the cards come round the curve from off the right-hand
    // edge of the screen — the one that ends on the left first, then the
    // centred one, then the one to its right — turning into place as they
    // rise up into it from below, and the glass comes up as they settle. A
    // reel comes up round its drum from below the screen instead, drifting
    // in from the right as it comes. Nothing that would only be passing
    // through from the far side is drawn while they do, so no card appears
    // out of thin air; and the row takes no input until they are in.
    const intro = { spin: 0, drop: 0, glass: 1 };
    let entering = false;
    let entry: gsap.core.Timeline | null = null;
    // Told once, as the cards come to rest — or on the first frame, with no
    // way in to wait for.
    let arrived = false;
    const arrive = () => {
        if (arrived) return;
        arrived = true;
        o.onArrive();
    };
    if (o.entry && !reduced) {
        entering = true;
        Object.assign(intro, { spin: -ENTRY_TURN, drop: (vertical ? cardW : cardH) * ENTRY_RISE, glass: 0 });
        entry = gsap
            .timeline({
                onComplete: () => {
                    entering = false;
                },
            })
            .to(intro, { spin: 0, duration: ENTRY_TIME, ease: "power3.out" }, 0)
            .to(intro, { drop: 0, duration: ENTRY_TIME * 1.05, ease: "power3.out" }, 0)
            .to(intro, { glass: 1, duration: 0.7, ease: "power2.inOut" }, ENTRY_TIME * 0.6)
            .call(arrive, undefined, ENTRY_TIME * ENTRY_SETTLE);
    }

    // How far the centred card has come forward, 0..1 — see the tick; and,
    // while it is opened over, how far the others have parted from it.
    const forward = { v: 0 };
    const part = { v: 0 };
    let opened = false;
    let parting: gsap.core.Tween | null = null;
    // the centred card left out, something else drawing it; and a frame
    // owed after that changes, whatever else is going on
    let covered = false;
    let dirty = false;

    const place = () => {
        const shown = scroll + intro.spin;
        const centre = Math.round(shown);
        slots.forEach((slot, i) => {
            const k = centre + i - REACH;
            const rel = k - shown;
            // Parted, the others turn on round, away from it and out of sight.
            const theta = rel * step + Math.sign(rel) * PART * part.v;
            const picture = pictures[mod(k, N)];
            slot.uniforms.uMap.value = picture.tex;
            slot.uniforms.uReady.value = picture.ready ? 1 : 0;
            slot.uniforms.uCover.value.copy(picture.cover);
            const up = (rise * (1 - Math.cos(theta))) / (1 - Math.cos(step));
            // Forward, the card in the middle — as much as it is there.
            const grow = 1 + FORWARD * forward.v * Math.max(0, 1 - Math.abs(rel) * 2);
            slot.mesh.visible =
                Math.abs(theta) < Math.PI / 2 && !(entering && k < -1) && !(covered && Math.abs(rel) < 0.5);
            if (vertical) {
                // Down the drum: the ones round it tilting back, bowing out to
                // the right and tipping to follow the bow.
                slot.mesh.position.set(up + intro.drop, -radius * Math.sin(theta), radius * Math.cos(theta) - radius);
                slot.mesh.rotation.set(theta, 0, TIP * theta);
            } else {
                slot.mesh.position.set(radius * Math.sin(theta), baseY + up - intro.drop, radius * Math.cos(theta) - radius);
                slot.mesh.rotation.set(0, theta, TIP * theta);
            }
            slot.mesh.scale.set(cardW * grow, cardH * grow, 1);
        });
    };

    // The row into the texture, then the glass and the focus over it.
    const draw = () => {
        place();
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);
    };

    const go = (direction: number) => {
        if (entering || opened) return;
        target = Math.round(target) + direction;
    };

    // Dragging, flicking and clicking — and whether the mouse is over the
    // centred card, or a finger held down on it.
    let dragging = false;
    let pointerId = -1;
    let startAt = 0;
    let startScroll = 0;
    let moved = 0;
    let trail: { at: number; t: number }[] = [];
    let over = false;
    let held = false;
    const lens = { x: 0, y: 0, tx: 0, ty: 0, a: 0, on: false };

    const local = (e: PointerEvent) => {
        const b = mount.getBoundingClientRect();
        return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    // Where the pointer is along the track: across a row, down a reel.
    const along = (e: PointerEvent) => (vertical ? e.clientY : e.clientX);
    const inCard = (p: { x: number; y: number }) =>
        p.x >= rect.left && p.x <= rect.left + rect.width && p.y >= rect.top && p.y <= rect.top + rect.height;

    const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || entering || opened) return;
        held = inCard(local(e));
        dragging = true;
        pointerId = e.pointerId;
        startAt = along(e);
        startScroll = scroll;
        moved = 0;
        trail = [{ at: startAt, t: performance.now() }];
        canvas.setPointerCapture(e.pointerId);
    };

    // The pointer as what is under it: a hand over what a click does
    // something with — the centred card, and on a reel the ones above and
    // below it; a fist mid-drag; nothing special anywhere else, the bare
    // page either side of a reel included.
    const cursorAt = (p: { x: number; y: number }) => {
        if (dragging && moved > CLICK_SLOP) return "grabbing";
        if (entering || opened) return "default";
        if (!vertical) return "pointer";
        return p.x >= rect.left && p.x <= rect.left + rect.width ? "pointer" : "default";
    };

    const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType === "mouse") {
            const p = local(e);
            over = inCard(p);
            canvas.style.cursor = cursorAt(p);
            lens.tx = p.x;
            lens.ty = p.y;
            if (!lens.on && lens.a < 0.01) {
                lens.x = p.x;
                lens.y = p.y;
            }
            lens.on = true;
        }
        if (!dragging || e.pointerId !== pointerId) return;
        const d = along(e) - startAt;
        moved = Math.max(moved, Math.abs(d));
        scroll = startScroll - d / perStep;
        target = scroll;
        const now = performance.now();
        trail.push({ at: along(e), t: now });
        trail = trail.filter((s) => now - s.t <= 120);
        if (moved > CLICK_SLOP) canvas.style.cursor = "grabbing";
    };

    const onPointerUp = (e: PointerEvent) => {
        if (!dragging || e.pointerId !== pointerId) return;
        dragging = false;
        held = false;
        canvas.style.cursor = cursorAt(local(e));
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);

        if (moved < (e.pointerType === "touch" ? TOUCH_CLICK_SLOP : CLICK_SLOP)) {
            const p = local(e);
            if (inCard(p)) o.onCardClick(mod(Math.round(target), N));
            else if (!vertical) go(p.x < W / 2 ? -1 : 1);
            // A reel turns only for a click above or below the centred card.
            else if (p.x >= rect.left && p.x <= rect.left + rect.width) go(p.y < rect.top ? -1 : 1);
            return;
        }

        // A flick carries on at the speed it was let go at, a card or two;
        // a slow drag settles on whichever card is nearest — but always at
        // least one on from where it started, if it was dragged far enough
        // to mean it.
        const first = trail[0] ?? { at: along(e), t: performance.now() };
        const speed = (along(e) - first.at) / Math.max(1, performance.now() - first.t);
        const throw_ = Math.max(-2, Math.min(2, (-speed * FLICK) / perStep));
        let to = Math.round(scroll + throw_);
        const from = Math.round(startScroll);
        if (to === from && Math.abs(scroll - startScroll) > 0.15) to = from + Math.sign(scroll - startScroll);
        target = to;
    };

    const onPointerLeave = () => {
        over = false;
        lens.on = false;
    };

    let wheelLast = 0;
    let wheelSum = 0;
    let wheelDone = false;
    const onWheel = (e: WheelEvent) => {
        // Opened over, the wheel is left to what is open — its words scroll.
        if (opened) return;
        e.preventDefault();
        if (entering) return;
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const now = performance.now();
        if (now - wheelLast > WHEEL_GAP_MS) {
            wheelSum = 0;
            wheelDone = false;
        }
        wheelLast = now;
        if (wheelDone) return;
        wheelSum += d;
        if (Math.abs(wheelSum) >= WHEEL_STEP) {
            go(Math.sign(wheelSum));
            wheelDone = true;
        }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    const wheelOn = o.wheelTarget ?? canvas;
    wheelOn.addEventListener("wheel", onWheel, { passive: false });

    // A new size clears the canvas. Drawn again there and then — before the
    // frame is painted — it never shows blank in between.
    const observer = new ResizeObserver(() => {
        measure();
        draw();
    });
    observer.observe(mount);

    let frame = 0;
    let last = performance.now();
    // Told on the first frame, whatever it is.
    let lastActive = -1;
    // The first light crosses once the cards are in.
    let sweepFrom = performance.now() + (entering ? ENTRY_TIME * 1000 : 600);

    const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min(64, now - last);
        last = now;
        const k = (ease: number) => 1 - Math.pow(1 - ease, dt / (1000 / 60));

        if (!dragging) {
            scroll += (target - scroll) * k(reduced ? 0.5 : EASE);
            if (Math.abs(target - scroll) < 0.0005) scroll = target;
        }

        const active = mod(Math.round(dragging ? scroll : target), N);
        if (active !== lastActive) {
            // A new card in the middle: the light crosses it as it arrives.
            if (lastActive !== -1) sweepFrom = now + SWEEP_ARRIVE * 1000;
            lastActive = active;
            o.onActiveChange(active);
        }

        // The light across the centred card, every so often — easing in
        // and out of its crossing. Covered, none sets off: what covers the
        // card carries on any already crossing it, and the card comes back
        // clear, the light crossing it a moment after, as it arrives.
        if (covered) sweepFrom = now + SWEEP_ARRIVE * 1000;
        let sweep = (now - sweepFrom) / 1000 / SWEEP_TIME;
        if (sweep > 1 + SWEEP_REST / SWEEP_TIME) {
            sweepFrom = now;
            sweep = 0;
        }
        post.uSweep.value = reduced || sweep <= 0 || sweep >= 1 ? -1 : 0.5 - 0.5 * Math.cos(Math.PI * sweep);

        const follow = reduced ? 1 : k(LENS_FOLLOW);
        lens.x += (lens.tx - lens.x) * follow;
        lens.y += (lens.ty - lens.y) * follow;
        // Covered, the lens is left to what covers the card; uncovered, it
        // comes back in.
        lens.a += ((lens.on && !dragging && !opened && !covered ? 1 : 0) - lens.a) * k(0.15);
        // Opened over, the glass goes as the others part, and comes back
        // with them — at once, while the card is covered: what covers it
        // draws its glass.
        const clear = covered ? 0 : intro.glass * (1 - part.v);
        post.uLens.value.set(lens.x * dpr, (H - lens.y) * dpr, lens.a * clear);
        post.uGlass.value = clear;
        post.uTime.value = now / 1000;

        // The centred card comes forward under the mouse, or under a finger
        // held down on it, to say it can be opened — but not mid-drag,
        // mid-turn or on the way in. The glass round it comes with it.
        // Opened over or covered, it holds as it was, so what opened over it
        // still fits it, and hands it back exactly where it took it.
        const settled = !entering && Math.abs(target - scroll) < 0.05 && !(dragging && moved > CLICK_SLOP);
        if (!opened && !covered) forward.v += (((over || held) && settled ? 1 : 0) - forward.v) * k(0.16);
        const g = 1 + FORWARD * forward.v;
        post.uCard.value.z = (cardW / 2) * dpr * g;
        post.uCard.value.w = (cardH / 2) * dpr * g;
        post.uCardR.value = CORNER * cardH * dpr * g;

        if (!entering) arrive();
        // Opened over with the others parted, there is nothing new to show:
        // the last frame stands until they come back.
        if (opened && part.v >= 1 && !dirty) return;
        dirty = false;
        draw();
    };
    frame = requestAnimationFrame(tick);

    // Nothing to draw for a tab nobody is looking at.
    const onVisibility = () => {
        cancelAnimationFrame(frame);
        if (!document.hidden) {
            last = performance.now();
            frame = requestAnimationFrame(tick);
        }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Opened over: the others part away round the track, the glass going
    // with them, and nothing moves it until it is let go. The centred card
    // is settled right where it was headed and held as it is, come forward
    // or not, so what opens over it starts exactly on it — see `shape`.
    const hold = (leave: CurvedGlassLeave) => {
        entry?.progress(1);
        opened = true;
        dragging = false;
        held = false;
        scroll = target = Math.round(target);
        parting?.kill();
        parting = gsap.to(part, {
            v: 1,
            delay: reduced ? 0 : leave.delay,
            duration: reduced ? 0 : leave.duration,
            ease: leave.ease,
        });
    };

    // How far round the others have to have turned for the nearest of them
    // to be just out of sight past the row's edge — as the row is laid out
    // now, seen through the camera.
    const outOfSight = () => {
        const D = H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
        for (let v = 0; v <= 1; v += 0.01) {
            const theta = step + PART * v;
            // its edge nearest the centred card, where it is on the screen
            const along = vertical
                ? -radius * Math.sin(theta) + (cardH / 2) * Math.cos(theta)
                : radius * Math.sin(theta) - (cardW / 2) * Math.cos(theta);
            const depth = radius * Math.cos(theta) - radius + ((vertical ? cardH : cardW) / 2) * Math.sin(theta);
            const seen = (along * D) / (D - depth);
            if (vertical ? seen <= -H / 2 : seen >= W / 2) return Math.min(1, v + 0.02);
        }
        return 1;
    };

    // Closed again: `back.delay` seconds on, the others come back round it —
    // from just out of sight rather than from as far round as they went, so
    // the whole of their return is seen, over the stretch and on the curve it
    // is given — and then it is free to move.
    const release = (back: CurvedGlassLeave) => {
        // Covered as it is, the card goes back to its resting size at once,
        // unseen — what covers it goes back down to that size too — so it
        // lands once, and comes forward again only if the mouse is on it.
        forward.v = 0;
        parting?.kill();
        parting = gsap.fromTo(
            part,
            { v: () => Math.min(part.v, outOfSight()) },
            {
                v: 0,
                delay: reduced ? 0 : back.delay,
                duration: reduced ? 0 : back.duration,
                ease: back.ease,
                immediateRender: false,
                onComplete: () => {
                    opened = false;
                },
            }
        );
    };

    // A card on at once — under what is open, where nobody sees it go —
    // and told straight away, for what is open to change with it.
    const shift = (direction: number) => {
        scroll = target = Math.round(target) + direction;
        const active = mod(target, N);
        if (active !== lastActive) {
            lastActive = active;
            o.onActiveChange(active);
        }
    };

    // The centred card as it is drawn now, come forward or not — or at rest —
    // and the light and the lens on it.
    const shape = (resting = false) => {
        const g = resting ? 1 : 1 + FORWARD * forward.v;
        return {
            left: rect.left - (cardW * (g - 1)) / 2,
            top: rect.top - (cardH * (g - 1)) / 2,
            width: cardW * g,
            height: cardH * g,
            radius: CORNER * cardH * g,
            sweepFrom,
            lens: covered ? 0 : lens.a * intro.glass * (1 - part.v),
        };
    };

    return {
        next: () => go(1),
        previous: () => go(-1),
        hold,
        release,
        shift,
        rect: shape,
        cover: (on: boolean) => {
            covered = on;
            dirty = true;
        },
        resting: () => !entering && !opened && !dragging && Math.abs(target - scroll) < REST,
        destroy: () => {
            cancelAnimationFrame(frame);
            entry?.kill();
            parting?.kill();
            observer.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointercancel", onPointerUp);
            canvas.removeEventListener("pointerleave", onPointerLeave);
            wheelOn.removeEventListener("wheel", onWheel);
            slots.forEach((slot) => slot.material.dispose());
            pictures.forEach((picture) => {
                if (picture.tex !== blank) picture.tex.dispose();
            });
            blank.dispose();
            geometry.dispose();
            postGeometry.dispose();
            postMaterial.dispose();
            rt.dispose();
            renderer.dispose();
            canvas.remove();
        },
    };
}

/**
 * The works, as cards round a gentle curve seen from a little above: the
 * centred one nearest, lowest and biggest, sharp, behind a frame of glass
 * that bends its edges into red and blue evenly all the way round, gently
 * enough to read through — the glass's outer edge one fine glinting
 * line, a slow liquid swell drifting over it and every so often a band of
 * light sweeping across; the ones either side turning away and rising
 * behind it, soft and pale as if far back, cut off by the screen's edges. A
 * small glass lens follows the mouse over all of it, bending what is under
 * it. The cards come in round the curve from off the right of the screen,
 * rising as they come, and `onArrive` is told as the centred one comes to
 * rest.
 *
 * `vertical` makes it a reel instead — the same glass, the cards on a drum
 * that turns up and down, the ones above and below tilting back, soft and
 * pale, cut off by the top and the bottom.
 *
 * A drag or a swipe turns it, a flick a card or two, a wheel tick or a
 * trackpad swipe one card; clicking either side turns it toward that side.
 * The centred card comes forward under the mouse, or under a finger held on
 * it, and clicking it is `onCardClick` — what opens over it can `hold` it
 * there and `release` it after. It loops. Where WebGL cannot be had, the
 * centred card is shown on its own, still.
 */
export function CurvedGlassCarousel({
    items,
    label,
    aspect = ASPECT,
    vertical = false,
    crop = "top",
    entry = true,
    wheelTarget,
    controlRef,
    onActiveChange,
    onCardRect,
    onCardClick,
    onArrive,
    className,
}: {
    items: CurvedGlassItem[];
    label: string;
    /** The cards' shape, width over height — a desktop hero's by default. */
    aspect?: number;
    /** A reel, turning up and down, rather than a row. */
    vertical?: boolean;
    /** Where a picture taller than its card is cropped from — a page's top by default. */
    crop?: "top" | "center";
    /** Play the turn-in. Ignored when the user prefers reduced motion. */
    entry?: boolean;
    /** Where the wheel turns it, if not just over the carousel itself. */
    wheelTarget?: RefObject<HTMLElement | null>;
    controlRef?: RefObject<CurvedGlassHandle | null>;
    onActiveChange?: (index: number) => void;
    onCardRect?: (rect: CardRect) => void;
    onCardClick?: (index: number) => void;
    /** Told once, as the centred card comes to rest at the end of the way in. */
    onArrive?: () => void;
    className?: string;
}) {
    const mount = useRef<HTMLDivElement>(null);
    const stillCard = useRef<HTMLDivElement>(null);
    const [still, setStill] = useState<number | null>(null);
    const latest = useRef({ onActiveChange, onCardRect, onCardClick, onArrive });
    useEffect(() => {
        latest.current = { onActiveChange, onCardRect, onCardClick, onArrive };
    });

    useEffect(() => {
        const el = mount.current;
        if (!el) return;
        const engine = createTrack(el, {
            items,
            aspect,
            vertical,
            crop,
            entry,
            wheelTarget: wheelTarget?.current ?? undefined,
            onActiveChange: (i) => latest.current.onActiveChange?.(i),
            onCardRect: (r) => latest.current.onCardRect?.(r),
            onCardClick: (i) => latest.current.onCardClick?.(i),
            onArrive: () => latest.current.onArrive?.(),
        });

        // No WebGL: the centred card alone, still, and the buttons step it.
        if (!engine) {
            let at = 0;
            const show = (to: number) => {
                at = mod(to, items.length);
                setStill(at);
                latest.current.onActiveChange?.(at);
            };
            show(0);
            latest.current.onArrive?.();
            if (controlRef)
                controlRef.current = {
                    next: () => show(at + 1),
                    previous: () => show(at - 1),
                    hold: () => undefined,
                    cover: () => undefined,
                    release: () => undefined,
                    shift: (direction) => show(at + direction),
                    rect: () => {
                        const card = stillCard.current?.getBoundingClientRect();
                        const box = el.getBoundingClientRect();
                        const none = { sweepFrom: -Infinity, lens: 0 };
                        if (!card) return { left: 0, top: 0, width: 0, height: 0, radius: 0, ...none };
                        return {
                            left: card.left - box.left,
                            top: card.top - box.top,
                            width: card.width,
                            height: card.height,
                            radius: 12,
                            ...none,
                        };
                    },
                    resting: () => true,
                };
            return () => {
                if (controlRef) controlRef.current = null;
            };
        }

        if (controlRef) controlRef.current = engine;
        return () => {
            engine.destroy();
            if (controlRef) controlRef.current = null;
        };
    }, [items, aspect, vertical, crop, entry, wheelTarget, controlRef]);

    const fallback = still === null ? null : items[still];

    return (
        <div
            ref={mount}
            role="region"
            aria-roledescription="carousel"
            aria-label={label}
            className={cn("relative h-full w-full touch-none select-none overflow-hidden", className)}
        >
            {fallback && (
                <div
                    ref={stillCard}
                    style={{ aspectRatio: aspect }}
                    className={cn(
                        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl",
                        vertical ? "h-[56%] max-w-[86%]" : "max-h-[86%] w-[70%] max-w-[70%]"
                    )}
                >
                    <Image
                        src={fallback.src}
                        alt={fallback.alt}
                        fill
                        unoptimized
                        className={cn("object-cover", crop === "top" && "object-top")}
                    />
                </div>
            )}
        </div>
    );
}
