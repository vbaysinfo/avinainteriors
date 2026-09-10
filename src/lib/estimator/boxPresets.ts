// Standard modular carcass presets.
//
// In Semi Modular projects the carcass is civil-site-built to a shop standard: width and
// height come off a fixed catalogue so the civil mason/carpenter can work from a known
// template, and only depth (which depends on the actual site/wall condition) is customised
// per unit. These lists are that catalogue. Full Modular projects skip this entirely — every
// dimension is a free numeric input because the whole carcass is CNC-cut to spec in the factory.

export const BOX_WIDTH_PRESETS_FT: number[] = [
  1, 1.2, 1.5, 1.6, 1.8, 2, 2.5, 2.6, 2.8, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7,
];

export const BOX_HEIGHT_PRESETS_FT: Record<"box" | "drawer", number[]> = {
  box: [2, 2.3, 2.5, 2.8, 6, 6.5, 7, 7.5, 8],
  drawer: [0.5, 0.6, 0.8, 1, 1.2],
};

/** Depth for Semi Modular boxes starts at 0 (i.e. blank/area-basis) until the site depth is filled in. */
export const SEMI_MODULAR_DEFAULT_DEPTH_FT = 0;
