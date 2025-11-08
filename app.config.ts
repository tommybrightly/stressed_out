import { ExpoConfig } from "expo/config";


const config: ExpoConfig = {
name: "Stress Less",
slug: "StressLess",
scheme: "stressless",
orientation: "portrait",
userInterfaceStyle: "automatic",
ios: {
supportsTablet: true,
bundleIdentifier: "com.tbrightlty.stressless"
},
android: {
softwareKeyboardLayoutMode: "resize",
package: "com.tbrightly.stressless",
adaptiveIcon: {
backgroundColor: "#FFFFFF"
}
},

};
export default config;