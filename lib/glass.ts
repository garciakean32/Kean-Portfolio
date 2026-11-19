/* The glass the site's cards sit behind — the reel's and the works' centred
   card, and the experience's open card — in one place, so they bend the
   same. In CSS pixels unless said otherwise.

   The frame round a card: how far out from the card it stands. Its rim: how
   wide it is — a frame's reaching back a few pixels over the card itself —
   how far it bends what is under it, how far apart it splits the red from
   the blue, as a share of the bend, and how far it frosts what it bends, so
   a line near an edge reads as glass rather than as doubled. */
export const GLASS_PAD = 16;
export const GLASS_RIM = 20;
export const GLASS_BEND = 8;
export const GLASS_SPLIT = 0.38;
export const GLASS_FROST = 2.2;

/* The slow liquid wave over a picture behind the glass. A swell is measured
   against the picture's longer half-side, but never one shorter than
   `GLASS_WAVE_REACH`, so a narrow picture gets one long, gentle swell rather
   than a crowd of tight ones; and it moves the picture `GLASS_WAVE_SHARE` of
   that half-side, never more than `GLASS_WAVE_MAX` — a bend you can see
   without the picture losing its shape. */
export const GLASS_WAVE_SHARE = 0.008;
export const GLASS_WAVE_MAX = 3;
export const GLASS_WAVE_REACH = 260;

/* The light that crosses a card now and then: how long it takes, in seconds. */
export const GLASS_SWEEP_TIME = 1.6;

/* The lens under the pointer, and how closely it follows. */
export const GLASS_LENS_R = 68;
export const GLASS_LENS_FOLLOW = 0.22;
