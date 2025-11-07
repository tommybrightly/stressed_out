A simple mindfulness app built with React Native (Expo) featuring chat, doodling, and stress metrics.


## Quick start


```bash
npm i -g expo-cli # if needed
npx create-expo-app@latest calmsketch --template blank-typescript
cd calmsketch
# Replace the generated files with the ones in this repo
# Or copy src/, App.tsx, package.json, tsconfig.json, app.config.ts
npm install
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install react-native-svg react-native-chart-kit @react-native-async-storage/async-storage
npx expo install expo-status-bar


npm run start
# then: press i for iOS Simulator, a for Android, or scan QR in Expo Go