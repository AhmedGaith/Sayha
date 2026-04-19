/** Predefined outdoor missions — ids used for completion tracking */
export const MISSIONS = [
  { id: "green", title: "لقّى حاجة خضرا", points: 15, emoji: "🌿" },
  { id: "bird", title: "صوّر عصفور", points: 20, emoji: "🐦" },
  { id: "plants3", title: "لقّى 3 نباتات مختلفين", points: 25, emoji: "🌱" },
  { id: "cloud", title: "لقّى شكل سحابة يعجبك", points: 10, emoji: "☁️" },
  { id: "bug", title: "راقب حشرة بأمان", points: 15, emoji: "🐞" },
  { id: "texture", title: "لمس قشرة شجرة، حجر، وعشب", points: 15, emoji: "🪨" },
];

/** Every N points = one level (level 1 at 0 pts) */
export const POINTS_PER_LEVEL = 50;

export function levelFromPoints(points) {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function pointsToNextLevel(points) {
  const into = points % POINTS_PER_LEVEL;
  return POINTS_PER_LEVEL - into;
}
