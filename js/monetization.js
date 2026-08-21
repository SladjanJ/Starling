/** v1 hooks — wired, but they do nothing until there is an audience. */

export function unlockCosmetic(_id) {
  return false;
}

export function showRewardedRevive() {
  return Promise.resolve(false);
}

export function showBannerAd() {
  return false;
}

export const cosmetics = {
  birdTint: "#e8b45a",
  birdChest: "#f7ead3",
  birdOutline: "#2a1838",
  trail: false,
  skyTheme: "dusk",
};
