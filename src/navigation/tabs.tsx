import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../../src/screens/HomeScreen";
import DrawingScreen from "../screens/DrawingScreen";
import MetricsScreen from "../screens/MetricsScreen";
import { Ionicons } from "@expo/vector-icons";


const Tab = createBottomTabNavigator();


export default function Tabs() {
return (
<Tab.Navigator screenOptions={{ headerShown: true }}>
<Tab.Screen
name="Home"
component={HomeScreen}
options={{
tabBarIcon: ({ color, size }: { color: string; size: number }) => (
<Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
)
}}
/>
<Tab.Screen
name="Draw"
component={DrawingScreen}
options={{
tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="brush-outline" color={color} size={size} />
}}
/>
<Tab.Screen
name="Metrics"
component={MetricsScreen}
options={{
tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="stats-chart-outline" color={color} size={size} />
}}
/>
</Tab.Navigator>
);
}