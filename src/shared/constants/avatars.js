// Six curated preset avatars — no image assets to ship (rendered by DiceBear
// avataaars with fixed parameters so each face is deterministic). We cover
// three men and three women across three age ranges: young, middle-aged and
// senior. The chosen `uri` is stored on the user.
const BASE = 'https://api.dicebear.com/9.x/avataaars/png';

// Shared traits pinned on every preset so the faces stay neutral and
// professional — open (non-blinking) eyes, calm eyebrows, a gentle smile and a
// consistent skin tone. Without these, DiceBear randomises the expression and
// produces odd faces (dizzy eyes, grimaces, frowns).
const NEUTRAL = 'eyes=default&eyebrows=default&mouth=smile&skinColor=ffdbb4';

// Per-preset traits convey gender + age. Probabilities are pinned to 0/100 and
// enums to a single value so the render is stable. `label` is the a11y hint.
const PRESETS = [
  {
    id: 'man-young',
    label: 'Young man',
    params:
      'seed=Kai&top=shortFlat&hairColor=2c1b18&facialHairProbability=0&accessoriesProbability=0&clothing=hoodie&clothesColor=3c4f5c&backgroundColor=b6e3f4',
  },
  {
    id: 'man-middle',
    label: 'Middle-aged man',
    params:
      'seed=Daniel&top=shortCurly&hairColor=4a312c&facialHair=beardMedium&facialHairProbability=100&facialHairColor=4a312c&accessoriesProbability=0&clothing=blazerAndShirt&backgroundColor=c0aede',
  },
  {
    id: 'man-senior',
    label: 'Senior man',
    params:
      'seed=Arthur&top=shortFlat&hairColor=e8e1e1&facialHair=beardLight&facialHairProbability=100&facialHairColor=e8e1e1&accessories=prescription02&accessoriesProbability=100&clothing=shirtVNeck&backgroundColor=d1f7e8',
  },
  {
    id: 'woman-young',
    label: 'Young woman',
    params:
      'seed=Sofia&top=straight02&hairColor=724133&facialHairProbability=0&accessoriesProbability=0&clothing=shirtScoopNeck&clothesColor=ff6680&backgroundColor=ffd5dc',
  },
  {
    id: 'woman-middle',
    label: 'Middle-aged woman',
    params:
      'seed=Elena&top=bob&hairColor=2c1b18&facialHairProbability=0&accessoriesProbability=0&clothing=blazerAndSweater&backgroundColor=ffe7ba',
  },
  {
    id: 'woman-senior',
    label: 'Senior woman',
    params:
      'seed=Rose&top=bun&hairColor=e8e1e1&facialHairProbability=0&accessories=prescription01&accessoriesProbability=100&clothing=collarAndSweater&backgroundColor=eaf4ff',
  },
];

export const AVATARS = PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
  uri: `${BASE}?${p.params}&${NEUTRAL}&radius=50`,
}));
