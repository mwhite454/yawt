import ThemeController from "../ThemeController.tsx";

export const LoggedOut = () => (
  <div class="p-4">
    <ThemeController currentTheme="yawt" isLoggedIn={false} />
  </div>
);

export const LoggedInYawtTheme = () => (
  <div class="p-4">
    <ThemeController currentTheme="yawt" isLoggedIn={true} />
  </div>
);

export const LoggedInLightTheme = () => (
  <div class="p-4">
    <ThemeController currentTheme="light" isLoggedIn={true} />
  </div>
);

export const LoggedInDarkTheme = () => (
  <div class="p-4">
    <ThemeController currentTheme="dark" isLoggedIn={true} />
  </div>
);
