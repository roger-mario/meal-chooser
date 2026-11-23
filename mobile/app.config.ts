import type { ExpoConfig } from "expo/config";

// Set these in eas.json (per build profile) or in a local .env file; see README.md.
const bundleId = process.env.EXPO_PUBLIC_BUNDLE_ID || "app.otao.ios";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
// Google sends people back to the app through the reversed client id as a URL scheme.
const googleScheme = googleIosClientId ? googleIosClientId.split(".").reverse().join(".") : null;

const config: ExpoConfig = {
  name: "Otao",
  slug: "otao",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: googleScheme ? ["otao", googleScheme] : "otao",
  userInterfaceStyle: "light",
  backgroundColor: "#FFFCF8",
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: false,
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: bundleId.replace(/\.ios$/, ".android"),
    adaptiveIcon: {
      backgroundColor: "#047857",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: { favicon: "./assets/favicon.png", output: "single" },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    ["expo-splash-screen", { backgroundColor: "#FFFCF8", image: "./assets/splash-icon.png", imageWidth: 150 }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
};

export default config;
