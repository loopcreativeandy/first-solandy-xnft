import { registerRootComponent } from "expo";
import { RecoilRoot } from "recoil";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Inter_900Black } from "@expo-google-fonts/dev";

import { AndyScreen } from "./screens/AndyScreen";
import { MintScreen } from "./screens/MintScreen";

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Free cNFT Mint"
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
      }}
    >
    <Tab.Screen
      name="Free cNFT Mint"
      component={MintScreen}
      options={{
        tabBarLabel: "Mint",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="shovel" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Andys first xNFT"
      component={AndyScreen}
      options={{
        tabBarLabel: "Andy",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="key" color={color} size={size} />
        ),
      }}
    />
    </Tab.Navigator>
  );
}

function App() {
  let [fontsLoaded] = useFonts({
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <RecoilRoot>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </RecoilRoot>
  );
}

export default registerRootComponent(App);
