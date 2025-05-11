export function getTailwindScreenSize() {
  const screenSizes = {
    xs: 0,
    sm: 640, // Small screens start at 640px
    md: 768, // Medium screens start at 768px
    lg: 1024, // Large screens start at 1024px
    xl: 1280, // Extra-large screens start at 1280px
  };

  const screenWidth = window.innerWidth;

  const matchingScreens: string[] = [];

  // Determine the current screen size based on the window width
  if (screenWidth >= screenSizes.xl) {
    matchingScreens.push("xl");
  }
  if (screenWidth >= screenSizes.lg) {
    matchingScreens.push("lg");
  }
  if (screenWidth >= screenSizes.md) {
    matchingScreens.push("md");
  }
  if (screenWidth >= screenSizes.sm) {
    matchingScreens.push("sm");
  }
  if (screenWidth < screenSizes.sm) {
    matchingScreens.push("xs");
  }

  return matchingScreens;
}
