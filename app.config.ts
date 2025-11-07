import { ExpoConfig } from "expo/config";


const config: ExpoConfig = {
name: "Stress Less",
slug: "StressLess",
scheme: "calmsketch",
orientation: "portrait",
userInterfaceStyle: "automatic",
ios: {
supportsTablet: true,
bundleIdentifier: "com.example.stressless"
},
android: {
softwareKeyboardLayoutMode: "pan",
package: "com.example.stressless",
adaptiveIcon: {
backgroundColor: "#FFFFFF"
}
},

};
export default config;