// app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Stress Less",
  slug: "StressLess",
  scheme: "stressless",
  ios: {
    ...config.ios,
    bundleIdentifier: "com.tommybrightly.stressless",
    buildNumber: "1",
  },
  android: {
    ...config.android,
    package: "com.tommybrightly.stressless",
    versionCode: 1,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: "39d3af39-1bb1-401c-94bb-50a203935ce0", // <- REQUIRED
    },
  },
});
