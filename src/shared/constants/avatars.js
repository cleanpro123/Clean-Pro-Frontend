// Preset avatars, drawn as SVG at runtime: there are no image assets to ship
// and no third-party avatar service. The style is flat and illustrated, with
// natural proportions, soft shading and no outlines. Each preset is a small
// set of traits (hair, skin, outfit, extras) fed into one shared face
// template, so every face stays consistent.
//
// The value stored on the user is `avatar:<id>`; see `presetAvatarXml` below
// and the `Avatar` component that renders it.

export const AVATAR_PREFIX = 'avatar:';

// ---- Colour helpers -------------------------------------------------------

function shade(hex, amt) {
  // amt < 0 darkens, amt > 0 lightens (towards white), range -1..1
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ---- Hair -----------------------------------------------------------------
// Each style has an optional `back` layer (behind the head and body, for long
// hair) and a `front` layer (crown + hairline, over the face). Coordinates are
// in a 200×200 viewBox with the face centred on x = 100 (forehead ≈ y 48,
// chin ≈ y 150).

const HAIR = {
  // Short crop with a side part
  short: {
    front:
      'M62 98 C56 62 74 36 102 36 C128 36 144 58 138 98 C136 86 134 78 130 72 ' +
      'C116 74 96 70 82 60 C76 70 70 82 66 98 Z',
  },
  // Swept-up quiff
  quiff: {
    front:
      'M62 96 C58 66 66 46 82 38 C92 24 124 22 136 38 C144 52 142 76 138 96 C136 84 132 76 128 70 ' +
      'C114 68 94 66 78 66 C72 74 66 84 64 96 Z',
  },
  // Very short buzz cut
  buzz: {
    front: 'M63 90 C60 60 78 42 100 42 C122 42 140 60 137 90 C132 74 120 62 100 62 C80 62 68 74 63 90 Z',
  },
  // Short curly hair
  curly: {
    front:
      'M62 98 C54 90 56 76 62 70 C54 58 64 44 76 46 C78 34 94 30 102 36 C112 28 128 34 128 46 ' +
      'C142 46 148 60 140 70 C146 78 146 90 138 98 C136 86 132 78 126 74 C112 76 90 74 76 72 C70 78 66 88 62 98 Z',
  },
  // Long straight hair, side-swept
  long: {
    back: 'M60 90 C54 46 146 46 140 90 L148 178 C130 188 70 188 52 178 Z',
    front:
      'M60 108 C54 60 76 36 100 36 C126 36 146 60 140 108 C136 88 132 76 124 68 ' +
      'C110 72 90 74 74 70 C68 80 62 94 60 108 Z',
  },
  // Long wavy hair, middle part
  wavy: {
    back:
      'M60 88 C52 46 148 46 140 88 C146 108 140 122 148 140 C156 158 146 174 150 186 ' +
      'L50 186 C54 174 44 158 52 140 C60 122 54 108 60 88 Z',
    front:
      'M60 110 C54 62 74 36 100 36 C126 36 146 62 140 110 C138 92 134 78 126 70 C116 66 106 58 100 50 ' +
      'C94 58 84 66 74 70 C66 78 62 92 60 110 Z',
  },
  // Chin-length bob with a fringe
  bob: {
    back: 'M58 92 C52 50 148 50 142 92 L144 138 C130 146 70 146 56 138 Z',
    front:
      'M58 114 C52 62 74 36 100 36 C126 36 148 62 142 114 C138 96 136 84 132 76 ' +
      'C116 80 92 78 78 68 C72 80 64 96 58 114 Z',
  },
  // Top bun
  bun: {
    back: 'M84 34 C82 12 118 12 116 34 C112 42 88 42 84 34 Z',
    front:
      'M62 98 C56 62 74 36 100 36 C126 36 144 62 138 98 C136 86 132 78 128 72 ' +
      'C114 72 96 70 82 64 C74 72 68 84 64 98 Z',
  },
  // Ponytail
  ponytail: {
    back: 'M118 44 C144 36 162 56 158 88 C156 112 162 130 152 150 C144 132 140 110 136 90 Z',
    front:
      'M62 98 C56 62 74 36 100 36 C126 36 144 62 138 98 C136 86 132 76 126 70 ' +
      'C112 72 92 70 78 64 C72 72 66 84 64 98 Z',
  },
  // Afro / big natural curls
  afro: {
    back:
      'M54 104 C36 96 36 70 48 58 C42 40 60 22 80 26 C90 12 112 12 122 24 C142 20 160 38 152 58 ' +
      'C166 70 164 96 146 104 Z',
    front: 'M65 86 C64 60 80 48 100 48 C120 48 136 60 135 86 C128 66 116 58 100 58 C84 58 72 66 65 86 Z',
    shine: 'M70 34 Q88 22 110 24',
  },
  // Hijab (headscarf)
  hijab: {
    back:
      'M56 98 C50 50 150 50 144 98 C146 120 140 140 150 160 C156 172 160 186 162 200 L38 200 ' +
      'C40 186 44 172 50 160 C60 140 54 120 56 98 Z',
    front:
      'M58 100 C54 58 78 38 100 38 C122 38 146 58 142 100 C140 84 134 70 126 64 C110 58 90 58 74 64 C66 70 60 84 58 100 Z',
    extra: 'hijab',
  },
};

// ---- Outfits --------------------------------------------------------------

function outfit(kind, color) {
  const dark = shade(color, -0.18);
  const body = `<path d="M34 200 C36 178 62 164 100 164 C138 164 164 178 166 200 Z" fill="${color}"/>`;
  switch (kind) {
    case 'hoodie':
      return (
        body +
        `<path d="M68 166 C74 184 126 184 132 166 C122 174 78 174 68 166 Z" fill="${dark}"/>` +
        `<path d="M92 180 L91 196 M108 180 L109 196" stroke="${shade(color, 0.6)}" stroke-width="2.4" stroke-linecap="round"/>`
      );
    case 'shirt':
      return (
        body +
        `<path d="M84 164 L100 182 L92 190 L78 170 Z M116 164 L100 182 L108 190 L122 170 Z" fill="#ffffff"/>` +
        `<circle cx="100" cy="190" r="1.8" fill="${dark}"/><circle cx="100" cy="198" r="1.8" fill="${dark}"/>`
      );
    case 'blazer':
      return (
        body +
        `<path d="M86 164 L100 200 L114 164 Z" fill="#ffffff"/>` +
        `<path d="M86 164 L74 176 L84 182 L78 190 L96 200 L100 200 Z M114 164 L126 176 L116 182 L122 190 L104 200 L100 200 Z" fill="${dark}"/>`
      );
    case 'turtleneck':
      return body + `<path d="M84 156 L116 156 L118 172 C108 176 92 176 82 172 Z" fill="${dark}"/>`;
    case 'tee':
    default:
      return body + `<path d="M84 165 C88 176 112 176 116 165 C110 170 90 170 84 165 Z" fill="${dark}"/>`;
  }
}

// ---- Face parts -----------------------------------------------------------

function eyes(lashes) {
  const one = (cx, s) =>
    `<ellipse cx="${cx}" cy="101" rx="3.8" ry="4.6" fill="#2b2125"/>` +
    `<circle cx="${cx + 1.3}" cy="99.4" r="1.3" fill="#ffffff"/>` +
    (lashes
      ? `<path d="M${cx + 3 * s} 98 L${cx + 6.5 * s} 95.6" stroke="#2b2125" stroke-width="1.8" stroke-linecap="round"/>`
      : '');
  return one(84, -1) + one(116, 1);
}

function brows(color) {
  return (
    `<path d="M76 91 Q84 86 92 89" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M108 89 Q116 86 124 91" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`
  );
}

function mouth(kind, lip) {
  if (kind === 'grin') {
    return (
      `<path d="M88 122 Q100 125 112 122 Q108 136 100 136 Q92 136 88 122 Z" fill="#6e2a30"/>` +
      `<path d="M89.5 123 Q100 125.6 110.5 123 Q110 127 100 128 Q90 127 89.5 123 Z" fill="#ffffff"/>` +
      `<path d="M94 133 Q100 130 106 133 Q100 136 94 133 Z" fill="#d8707a"/>`
    );
  }
  return `<path d="M91 124 Q100 131 109 124" fill="none" stroke="${lip}" stroke-width="2.6" stroke-linecap="round"/>`;
}

function beard(color) {
  return (
    `<path d="M65 100 C64 134 82 156 100 156 C118 156 136 134 135 100 C132 114 126 124 118 128 ` +
    `C110 122 90 122 82 128 C74 124 68 114 65 100 Z" fill="${color}"/>`
  );
}

function stubble(color) {
  return (
    `<path d="M68 112 C70 136 86 152 100 152 C114 152 130 136 132 112 C126 128 116 136 100 136 C84 136 74 128 68 112 Z" fill="${color}" opacity="0.25"/>`
  );
}

function glasses() {
  return (
    `<rect x="72" y="92" width="24" height="18" rx="7" fill="#ffffff" fill-opacity="0.18" stroke="#2b2b33" stroke-width="2.2"/>` +
    `<rect x="104" y="92" width="24" height="18" rx="7" fill="#ffffff" fill-opacity="0.18" stroke="#2b2b33" stroke-width="2.2"/>` +
    `<path d="M96 100 Q100 97 104 100" fill="none" stroke="#2b2b33" stroke-width="2"/>`
  );
}

function earrings() {
  return `<circle cx="64" cy="114" r="2.4" fill="#f2c14e"/><circle cx="136" cy="114" r="2.4" fill="#f2c14e"/>`;
}

// ---- Full avatar ----------------------------------------------------------

function buildXml(p) {
  const hair = HAIR[p.hair];
  const covered = hair.extra === 'hijab';
  const skinShade = shade(p.skin, -0.1);
  const skinDeep = shade(p.skin, -0.22);
  const browColor = p.browColor || shade(p.hairColor, -0.3);
  const lip = p.lip || shade(p.skin, -0.45);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 20 164 164">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${shade(p.bg, 0.25)}"/><stop offset="1" stop-color="${p.bg}"/></linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#bg)"/>` +
    (hair.back ? `<path d="${hair.back}" fill="${shade(p.hairColor, -0.12)}"/>` : '') +
    // Neck, with a shadow under the jaw
    `<path d="M87 132 L87 170 Q100 178 113 170 L113 132 Z" fill="${skinShade}"/>` +
    `<path d="M87 140 Q100 152 113 140 L113 134 L87 134 Z" fill="${skinDeep}" opacity="0.5"/>` +
    outfit(p.outfit, p.outfitColor) +
    (covered && hair.back ? `<path d="M50 160 C60 140 140 140 150 160 C156 172 160 186 162 200 L38 200 C40 186 44 172 50 160 Z" fill="${shade(p.hairColor, -0.12)}"/>` : '') +
    // Ears (hidden under a headscarf)
    (covered
      ? ''
      : `<ellipse cx="64" cy="103" rx="7" ry="10" fill="${p.skin}"/><ellipse cx="65" cy="103" rx="3.5" ry="6" fill="${skinShade}"/>` +
        `<ellipse cx="136" cy="103" rx="7" ry="10" fill="${p.skin}"/><ellipse cx="135" cy="103" rx="3.5" ry="6" fill="${skinShade}"/>`) +
    // Face
    `<path d="M64 92 C64 128 80 150 100 150 C120 150 136 128 136 92 C136 62 120 46 100 46 C80 46 64 62 64 92 Z" fill="${p.skin}"/>` +
    (p.facialHair === 'stubble' ? stubble(shade(p.hairColor, -0.2)) : '') +
    // Soft shadow the hair casts on the forehead
    `<path d="${hair.front}" fill="${skinDeep}" opacity="0.35" transform="translate(0 4)"/>` +
    brows(browColor) +
    eyes(p.lashes) +
    // Nose
    `<path d="M97 112 Q100 116 103 112" fill="none" stroke="${skinDeep}" stroke-width="2.2" stroke-linecap="round"/>` +
    // Cheeks
    `<ellipse cx="78" cy="116" rx="7" ry="4" fill="#ff7f7f" opacity="0.18"/>` +
    `<ellipse cx="122" cy="116" rx="7" ry="4" fill="#ff7f7f" opacity="0.18"/>` +
    (p.facialHair === 'beard' ? beard(shade(p.hairColor, -0.05)) : '') +
    mouth(p.mouth, lip) +
    (p.glasses ? glasses() : '') +
    (p.earrings && !covered ? earrings() : '') +
    // Hair, with a soft highlight
    `<path d="${hair.front}" fill="${p.hairColor}"/>` +
    (covered
      ? `<path d="M64 74 C76 62 124 62 136 74" fill="none" stroke="${shade(p.hairColor, -0.15)}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="${hair.shine || 'M80 50 Q96 42 114 44'}" fill="none" stroke="${shade(p.hairColor, 0.25)}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`) +
    `</svg>`
  );
}

// ---- Presets --------------------------------------------------------------
// `label` is the accessibility hint read by screen readers.

const SKIN = { fair: '#fde2cf', light: '#f3c9a8', medium: '#d9a27a', tan: '#bf8459', brown: '#8d5a3b', deep: '#5e3a26' };
const HAIR_COLOR = { black: '#23201f', darkBrown: '#3b2a22', brown: '#6b4630', auburn: '#8a3b22', blonde: '#d9b26a', grey: '#b8b4b0', red: '#b5512d' };

const PRESETS = [
  // Men
  { id: 'arjun', label: 'Man with short black hair', hair: 'short', hairColor: HAIR_COLOR.black, skin: SKIN.medium, outfit: 'shirt', outfitColor: '#4a78c2', bg: '#cfe3ff', mouth: 'smile' },
  { id: 'daniel', label: 'Man with a beard', hair: 'quiff', hairColor: HAIR_COLOR.darkBrown, skin: SKIN.light, outfit: 'tee', outfitColor: '#2f3a4a', bg: '#dcd3ff', facialHair: 'beard', mouth: 'smile' },
  { id: 'leo', label: 'Man with blond hair', hair: 'quiff', hairColor: HAIR_COLOR.blonde, skin: SKIN.fair, outfit: 'hoodie', outfitColor: '#e0654f', bg: '#bfdcf5', mouth: 'grin' },
  { id: 'marcus', label: 'Man with curly hair', hair: 'curly', hairColor: HAIR_COLOR.black, skin: SKIN.brown, outfit: 'blazer', outfitColor: '#33415c', bg: '#c9ecdf', mouth: 'grin' },
  { id: 'omar', label: 'Man with glasses and stubble', hair: 'short', hairColor: HAIR_COLOR.black, skin: SKIN.tan, outfit: 'turtleneck', outfitColor: '#5d6b5a', bg: '#e6e0d4', glasses: true, facialHair: 'stubble', mouth: 'smile' },
  { id: 'kwame', label: 'Man with a buzz cut', hair: 'buzz', hairColor: HAIR_COLOR.black, skin: SKIN.deep, outfit: 'tee', outfitColor: '#e8a53c', bg: '#fff0c4', mouth: 'grin' },
  { id: 'george', label: 'Older man with grey hair', hair: 'short', hairColor: HAIR_COLOR.grey, skin: SKIN.light, outfit: 'blazer', outfitColor: '#5a4a3f', bg: '#e2ecf2', glasses: true, facialHair: 'beard', mouth: 'smile' },
  { id: 'ryan', label: 'Teenage boy', hair: 'curly', hairColor: HAIR_COLOR.auburn, skin: SKIN.fair, outfit: 'hoodie', outfitColor: '#3f8f6b', bg: '#d4f2e2', mouth: 'grin' },
  { id: 'ken', label: 'Young man with a side part', hair: 'short', hairColor: HAIR_COLOR.darkBrown, skin: SKIN.light, outfit: 'tee', outfitColor: '#7b5cc4', bg: '#e9dcff', mouth: 'smile' },

  // Women
  { id: 'sofia', label: 'Woman with long brown hair', hair: 'long', hairColor: HAIR_COLOR.brown, skin: SKIN.light, outfit: 'tee', outfitColor: '#d9577a', bg: '#ffd9e4', lashes: true, lip: '#c4566a', mouth: 'smile', earrings: true },
  { id: 'aisha', label: 'Woman wearing a hijab', hair: 'hijab', hairColor: '#5b7fa6', skin: SKIN.medium, outfit: 'tee', outfitColor: '#5b7fa6', bg: '#d8e8f7', lashes: true, lip: '#b45a62', browColor: '#2b1f1a', mouth: 'smile' },
  { id: 'maya', label: 'Woman with a bob', hair: 'bob', hairColor: HAIR_COLOR.black, skin: SKIN.fair, outfit: 'turtleneck', outfitColor: '#2f4858', bg: '#cdeee8', lashes: true, lip: '#c4566a', mouth: 'smile' },
  { id: 'chloe', label: 'Woman with wavy blonde hair', hair: 'wavy', hairColor: HAIR_COLOR.blonde, skin: SKIN.fair, outfit: 'blazer', outfitColor: '#c8a27a', bg: '#dcd6ff', lashes: true, lip: '#d0607a', mouth: 'grin', earrings: true },
  { id: 'zara', label: 'Woman with natural curls', hair: 'afro', hairColor: HAIR_COLOR.black, skin: SKIN.brown, outfit: 'tee', outfitColor: '#e2b13c', bg: '#ffe9b5', lashes: true, lip: '#7a3b3f', mouth: 'grin', earrings: true },
  { id: 'priya', label: 'Woman with a ponytail', hair: 'ponytail', hairColor: HAIR_COLOR.black, skin: SKIN.tan, outfit: 'hoodie', outfitColor: '#6c63c7', bg: '#e1ddff', lashes: true, lip: '#a84d5a', mouth: 'smile' },
  { id: 'elena', label: 'Woman with red wavy hair', hair: 'wavy', hairColor: HAIR_COLOR.red, skin: SKIN.fair, outfit: 'shirt', outfitColor: '#3e7d6a', bg: '#d6efe4', lashes: true, lip: '#c4566a', mouth: 'smile' },
  { id: 'rose', label: 'Older woman with glasses', hair: 'bun', hairColor: HAIR_COLOR.grey, skin: SKIN.light, outfit: 'turtleneck', outfitColor: '#8a4f6b', bg: '#f2dfe9', lashes: true, glasses: true, lip: '#b0606e', mouth: 'smile' },
  { id: 'lily', label: 'Teenage girl', hair: 'long', hairColor: HAIR_COLOR.auburn, skin: SKIN.light, outfit: 'hoodie', outfitColor: '#4fa3d9', bg: '#d3ecff', lashes: true, lip: '#d0607a', mouth: 'grin' },
];

// SVG ids (gradients) are namespaced per preset: on web every avatar is
// inlined into the same document, so shared ids would collide.
const XML = Object.fromEntries(
  PRESETS.map((p) => [p.id, buildXml(p).replace(/(id="|url\(#)/g, `$1${p.id}-`)]),
);

export const AVATARS = PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
  uri: `${AVATAR_PREFIX}${p.id}`,
}));

export function presetAvatarXml(value) {
  if (typeof value !== 'string' || !value.startsWith(AVATAR_PREFIX)) return null;
  return XML[value.slice(AVATAR_PREFIX.length)] || null;
}
