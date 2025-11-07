import { ExpoConfig } from "expo/config";


const config: ExpoConfig = {
name: "CalmSketch",
slug: "calmsketch",
scheme: "calmsketch",
orientation: "portrait",
userInterfaceStyle: "automatic",
ios: {
supportsTablet: true,
bundleIdentifier: "com.example.calmsketch"
},
android: {
package: "com.example.calmsketch",
adaptiveIcon: {
backgroundColor: "#FFFFFF"
}
},
extra: {
// Put secrets in app config or use expo-env if you wire a real AI API later
}
};
export default config;