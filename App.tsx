import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import Tabs from "src/navigation/tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";


export default function App() {
return (
<NavigationContainer>
<SafeAreaView style={{ flex: 1 }}>
<View style={{ flex: 1 }}>
<Tabs />
<StatusBar style="auto" />
</View>
</SafeAreaView>
</NavigationContainer>
);
}

