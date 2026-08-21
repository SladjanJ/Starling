export const CAMPAIGN = [
  { id: 1, seed: 101, distance: 1600, speed: 150, gap: 0.44, spacing: 280, dusk: 0.15 },
  { id: 2, seed: 202, distance: 2300, speed: 165, gap: 0.4, spacing: 260, dusk: 0.25 },
  { id: 3, seed: 303, distance: 3000, speed: 178, gap: 0.37, spacing: 245, dusk: 0.35 },
  { id: 4, seed: 404, distance: 3800, speed: 190, gap: 0.34, spacing: 235, dusk: 0.48 },
  { id: 5, seed: 505, distance: 4600, speed: 205, gap: 0.32, spacing: 225, dusk: 0.58 },
  { id: 6, seed: 606, distance: 5500, speed: 220, gap: 0.3, spacing: 215, dusk: 0.7 },
  { id: 7, seed: 707, distance: 6800, speed: 232, gap: 0.28, spacing: 205, dusk: 0.82 },
  { id: 8, seed: 808, distance: 8400, speed: 248, gap: 0.26, spacing: 195, dusk: 0.95 },
  { id: 9, seed: 909, distance: 9800, speed: 256, gap: 0.25, spacing: 190, dusk: 0.96 },
  { id: 10, seed: 1010, distance: 11400, speed: 264, gap: 0.24, spacing: 185, dusk: 0.97 },
  { id: 11, seed: 1111, distance: 13200, speed: 270, gap: 0.235, spacing: 180, dusk: 0.98 },
  { id: 12, seed: 1212, distance: 15200, speed: 276, gap: 0.23, spacing: 176, dusk: 0.98 },
  { id: 13, seed: 1313, distance: 17400, speed: 282, gap: 0.225, spacing: 172, dusk: 0.99 },
  { id: 14, seed: 1414, distance: 19800, speed: 288, gap: 0.22, spacing: 168, dusk: 0.99 },
  { id: 15, seed: 1515, distance: 22400, speed: 294, gap: 0.215, spacing: 164, dusk: 1 },
  { id: 16, seed: 1616, distance: 25200, speed: 300, gap: 0.21, spacing: 160, dusk: 1 },
  { id: 17, seed: 1717, distance: 28200, speed: 306, gap: 0.205, spacing: 156, dusk: 1 },
  { id: 18, seed: 1818, distance: 31400, speed: 312, gap: 0.2, spacing: 152, dusk: 1 },
  { id: 19, seed: 1919, distance: 34800, speed: 318, gap: 0.195, spacing: 148, dusk: 1 },
  { id: 20, seed: 2020, distance: 38600, speed: 324, gap: 0.19, spacing: 145, dusk: 1 },
];

export const LAST_LEVEL = CAMPAIGN[CAMPAIGN.length - 1].id;

export const ENDLESS = {
  id: "endless",
  seed: Date.now() % 99991,
  distance: Infinity,
  speed: 168,
  speedGain: 5.5,
  maxSpeed: 280,
  gap: 0.36,
  spacing: 240,
  dusk: 0.55,
};

export function getLevel(id) {
  return CAMPAIGN.find((l) => l.id === id) || CAMPAIGN[0];
}
