export const synonyms: Record<string, string[]> = {
  "chicken breast": ["chicken", "chicken fillet", "chicken breasts"],
  "ground beef": ["mince", "beef mince", "minced beef"],
  "lean beef mince": ["beef mince", "minced beef", "ground beef"],
  "turkey mince": ["ground turkey", "minced turkey"],
  "greek yogurt": ["greek yoghurt", "plain yogurt", "yoghurt"],
  "cottage cheese": ["curd cheese"],
  "cream cheese": ["soft cheese"],
  "cherry tomatoes": ["cherry toms", "tomatoes", "baby tomatoes"],
  "spring onions": ["scallions", "green onions", "spring onion"],
  "spring onion": ["scallion", "green onion"],
  courgette: ["zucchini"],
  aubergine: ["eggplant"],
  "bell pepper": ["capsicum", "sweet pepper"],
  "red pepper": ["capsicum", "bell pepper"],
  "yellow pepper": ["capsicum", "bell pepper"],
  "green pepper": ["capsicum", "bell pepper"],
  coriander: ["cilantro"],
  rocket: ["arugula"],
  "olive oil": ["extra virgin olive oil"],
  "sweet potato": ["sweetpotato"],
  "brown rice": ["wholegrain rice"],
  "basmati rice": ["basmati"],
  "jasmine rice": ["jasmine"],
  quinoa: ["quinoa grain"],
  "rice noodles": ["vermicelli", "rice vermicelli"],
  "rolled oats": ["oats", "porridge oats"],
  spaghetti: ["pasta"],
  "tomato passata": ["passata", "tomato puree"],
  "crushed tomatoes": ["chopped tomatoes", "tinned tomatoes"],
  "soy sauce": ["tamari", "light soy"],
  "sesame oil": ["toasted sesame oil"],
  "lemon juice": ["lemon"],
  lime: ["lime juice"],
  "smoked salmon": ["salmon", "salmon fillet"],
  shrimp: ["prawns"],
  "canned tuna": ["tuna"],
  chickpeas: ["garbanzo beans"],
  "black beans": ["black beans"],
  "kidney beans": ["red kidney beans"],
  "wholewheat wrap": ["whole wheat wrap", "tortilla"],
  "corn tortillas": ["corn tortilla"],
  bagel: ["bagels"],
  "wholegrain bread": ["whole grain bread"],
  "sourdough bread": ["sourdough"],
  "feta cheese": ["feta"],
  mozzarella: ["mozzarella cheese"],
  parmesan: ["parmigiano", "parmigiano reggiano"],
  "basil pesto": ["pesto"],
  "green beans": ["haricots verts"],
  "baby spinach": ["spinach"],
};

export function ingredientInFridge(
  ingredientName: string,
  fridgeItems: { name: string }[],
): boolean {
  const lower = ingredientName.toLowerCase();
  const fridgeNames = fridgeItems.map((f) => f.name.toLowerCase());

  if (fridgeNames.some((f) => f.includes(lower) || lower.includes(f))) {
    return true;
  }

  const directSyns = synonyms[lower] ?? [];
  const reverseSyns = Object.entries(synonyms)
    .filter(([, list]) => list.includes(lower))
    .map(([key]) => key);
  const candidates = [lower, ...directSyns, ...reverseSyns];

  return candidates.some((candidate) =>
    fridgeNames.some((f) => f.includes(candidate) || candidate.includes(f)),
  );
}
