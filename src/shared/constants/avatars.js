// Eighteen curated preset avatars — no image assets to ship (rendered by
// DiceBear avataaars with fixed parameters so each face is deterministic). We
// cover men, women and teenagers with varied hair, facial hair, glasses and
// clothing so users have a proper range to pick from. The chosen `uri` is
// stored on the user.
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
    id: 'man-waved',
    label: 'Man with moustache',
    params:
      'seed=Leo&top=shortWaved&hairColor=090806&facialHair=moustacheFancy&facialHairProbability=100&facialHairColor=090806&accessoriesProbability=0&clothing=graphicShirt&clothesColor=5199e4&backgroundColor=b6e3f4',
  },
  {
    id: 'man-caesar',
    label: 'Bearded man',
    params:
      'seed=Omar&top=theCaesar&hairColor=2c1b18&facialHair=beardMajestic&facialHairProbability=100&facialHairColor=2c1b18&accessoriesProbability=0&clothing=collarAndSweater&clothesColor=262e33&backgroundColor=ffdfbf',
  },
  {
    id: 'man-glasses',
    label: 'Man with glasses',
    params:
      'seed=Ethan&top=shortRound&hairColor=724133&facialHairProbability=0&accessories=round&accessoriesProbability=100&clothing=shirtCrewNeck&clothesColor=65c9ff&backgroundColor=c0aede',
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
  {
    id: 'woman-long',
    label: 'Woman with long hair',
    params:
      'seed=Aisha&top=longButNotTooLong&hairColor=090806&facialHairProbability=0&accessoriesProbability=0&clothing=shirtScoopNeck&clothesColor=a7ffc4&backgroundColor=c0aede',
  },
  {
    id: 'woman-curvy',
    label: 'Woman with curly hair',
    params:
      'seed=Mia&top=curvy&hairColor=a55728&facialHairProbability=0&accessoriesProbability=0&clothing=blazerAndShirt&clothesColor=ff488e&backgroundColor=b6e3f4',
  },
  {
    id: 'woman-glasses',
    label: 'Woman with glasses',
    params:
      'seed=Nora&top=bigHair&hairColor=4a312c&facialHairProbability=0&accessories=prescription02&accessoriesProbability=100&clothing=graphicShirt&clothesColor=ffdeb5&backgroundColor=ffd5dc',
  },

  // Teenagers — youthful styling: no facial hair, casual hoodies/tees.
  {
    id: 'teen-boy-1',
    label: 'Teenage boy',
    params:
      'seed=Max&top=frizzle&hairColor=724133&facialHairProbability=0&accessoriesProbability=0&clothing=hoodie&clothesColor=ff5c5c&backgroundColor=b6e3f4',
  },
  {
    id: 'teen-boy-2',
    label: 'Teenage boy',
    params:
      'seed=Noah&top=dreads01&hairColor=090806&facialHairProbability=0&accessoriesProbability=0&clothing=graphicShirt&clothesColor=25557c&backgroundColor=ffdfbf',
  },
  {
    id: 'teen-boy-3',
    label: 'Teenage boy',
    params:
      'seed=Liam&top=shortCurly&hairColor=b58143&facialHairProbability=0&accessoriesProbability=0&clothing=shirtCrewNeck&clothesColor=929598&backgroundColor=d1f7e8',
  },
  {
    id: 'teen-girl-1',
    label: 'Teenage girl',
    params:
      'seed=Zoe&top=straight01&hairColor=4a312c&facialHairProbability=0&accessoriesProbability=0&clothing=hoodie&clothesColor=ff6680&backgroundColor=ffd5dc',
  },
  {
    id: 'teen-girl-2',
    label: 'Teenage girl',
    params:
      'seed=Lily&top=curly&hairColor=090806&facialHairProbability=0&accessoriesProbability=0&clothing=shirtScoopNeck&clothesColor=a7ffc4&backgroundColor=c0aede',
  },
  {
    id: 'teen-girl-3',
    label: 'Teenage girl',
    params:
      'seed=Emma&top=longButNotTooLong&hairColor=d6b370&facialHairProbability=0&accessoriesProbability=0&clothing=graphicShirt&clothesColor=65c9ff&backgroundColor=b6e3f4',
  },
];

export const AVATARS = PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
  uri: `${BASE}?${p.params}&${NEUTRAL}&radius=50`,
}));
