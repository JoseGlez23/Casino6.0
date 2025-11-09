import "react-native-gesture-handler";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { CoinsProvider } from "../context/CoinsContext";

// Pantallas principales
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import GamesScreen from "../screens/GamesScreen";
import SlotsScreen from "../screens/SlotsScreen";
import TransferScreen from "../screens/TransferScreen";
import SupportScreen from "../screens/SupportScreen";
import IdentityVerificationScreen from "../screens/IdentityVerificationScreen";

// Pantallas de Perfil
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

// Nueva pantalla de Wallet
import WalletScreen from "../screens/WalletScreen";

// AGREGAR ESTA IMPORTACIÓN
import BuyCoinsScreen from "../screens/BuyCoinsScreen";

// Juegos - Tragamonedas
import ClassicSlots from "../games/slots/ClassicSlots";
import FruitSlots from "../games/slots/FruitSlots";
import DiamondSlots from "../games/slots/DiamondSlots";
import LuckySevenSlots from "../games/slots/LuckySevenSlots";
import AnimalSlots from "../games/slots/AnimalSlots";

// Juegos - Cartas
import Blackjack from "../games/cards/Blackjack";
import Poker from "../games/cards/Poker";
import Baccarat from "../games/cards/Baccarat";
import War from "../games/cards/War";
import RedDog from "../games/cards/RedDog";

// Juegos - Ruleta
import Roulette from "../games/roulette/Roulette";
import AmericanRoulette from "../games/roulette/AmericanRoulette";

// Juegos - Dados
import Craps from "../games/dice/Craps";
import SicBo from "../games/dice/SicBo";
import DiceRoll from "../games/dice/DiceRoll";

// Juegos - Ruedas
import MoneyWheel from "../games/wheels/MoneyWheel";
import BigSix from "../games/wheels/BigSix";

// Juegos - Mesa
import Bingo from "../games/table/Bingo";
import Keno from "../games/table/Keno";
import WheelOfFortune from "../games/table/WheelOfFortune";
import Lottery from "../games/table/Lottery";
import ScratchCards from "../games/table/ScratchCards";

// Juegos - Especiales
import VideoPoker from "../games/specialty/VideoPoker";
import CaribbeanStud from "../games/specialty/CaribbeanStud";
import ThreeCardPoker from "../games/specialty/ThreeCardPoker";
import PaiGow from "../games/specialty/PaiGow";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused) => {
  const iconConfig = {
    Inicio: { focused: "home", outline: "home-outline" },
    Juegos: { focused: "game-controller", outline: "game-controller-outline" },
    Tragamonedas: { focused: "dice", outline: "dice-outline" },
    Transferir: { focused: "cash", outline: "cash-outline" },
    Soporte: { focused: "help-circle", outline: "help-circle-outline" },
  };
  const icons = iconConfig[routeName];
  return icons ? (focused ? icons.focused : icons.outline) : "help";
};

// 🔹 Subnavegador de Juegos
function GamesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GamesMain" component={GamesScreen} options={{ headerShown: false }} />
      
      {/* Juegos de Cartas */}
      <Stack.Screen name="Blackjack" component={Blackjack} options={{ 
        title: " Blackjack ", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="Poker" component={Poker} options={{ 
        title: "Texas Hold'em Poker", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="Baccarat" component={Baccarat} options={{ 
        title: " Baccarat", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="War" component={War} options={{ 
        title: " War Card Game", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="RedDog" component={RedDog} options={{ 
        title: " Red Dog", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Juegos de Ruleta */}
      <Stack.Screen name="Roulette" component={Roulette} options={{ 
        title: " Ruleta Europea", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="AmericanRoulette" component={AmericanRoulette} options={{ 
        title: " Ruleta Americana", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Juegos de Dados */}
      <Stack.Screen name="Craps" component={Craps} options={{ 
        title: " Craps", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="SicBo" component={SicBo} options={{ 
        title: " Sic Bo", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="DiceRoll" component={DiceRoll} options={{ 
        title: " Dice Roll", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Juegos de Ruedas */}
      <Stack.Screen name="MoneyWheel" component={MoneyWheel} options={{ 
        title: " Money Wheel", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="BigSix" component={BigSix} options={{ 
        title: " Big Six Wheel", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Juegos de Mesa */}
      <Stack.Screen name="Bingo" component={Bingo} options={{ 
        title: " Bingo", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="Keno" component={Keno} options={{ 
        title: " Keno", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="WheelOfFortune" component={WheelOfFortune} options={{ 
        title: " Wheel of Fortune", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="Lottery" component={Lottery} options={{ 
        title: "🎫 Lottery", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="ScratchCards" component={ScratchCards} options={{ 
        title: "🎫 Scratch Cards", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Juegos Especiales */}
      <Stack.Screen name="VideoPoker" component={VideoPoker} options={{ 
        title: " Video Poker", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="CaribbeanStud" component={CaribbeanStud} options={{ 
        title: " Caribbean Stud", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="ThreeCardPoker" component={ThreeCardPoker} options={{ 
        title: " Three Card Poker", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="PaiGow" component={PaiGow} options={{ 
        title: " Pai Gow Poker", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />

      {/* Tragamonedas también accesibles desde Juegos */}
      <Stack.Screen name="ClassicSlots" component={ClassicSlots} options={{ 
        title: " Tragaperras Clásica", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="FruitSlots" component={FruitSlots} options={{ 
        title: " Tragaperras de Frutas", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="DiamondSlots" component={DiamondSlots} options={{ 
        title: " Tragaperras de Diamantes", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="LuckySevenSlots" component={LuckySevenSlots} options={{ 
        title: " Lucky 7 Slots", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="AnimalSlots" component={AnimalSlots} options={{ 
        title: " Safari Slots", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
    </Stack.Navigator>
  );
}

function SlotsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SlotsMain" component={SlotsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClassicSlots" component={ClassicSlots} options={{ 
        title: " Tragaperras Clásica", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="FruitSlots" component={FruitSlots} options={{ 
        title: " Tragaperras de Frutas", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="DiamondSlots" component={DiamondSlots} options={{ 
        title: "Tragaperras de Diamantes", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="LuckySevenSlots" component={LuckySevenSlots} options={{ 
        title: " Lucky 7 Slots", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
      <Stack.Screen name="AnimalSlots" component={AnimalSlots} options={{ 
        title: " Safari Slots", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700", 
        headerTitleStyle: { fontWeight: "bold" } 
      }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopWidth: 2,
          borderTopColor: "#FFD700",
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: "INICIO" }} />
      <Tab.Screen name="Juegos" component={GamesStack} options={{ tabBarLabel: "JUEGOS" }} />
      <Tab.Screen name="Tragamonedas" component={SlotsStack} options={{ tabBarLabel: "SLOTS" }} />
      <Tab.Screen name="Transferir" component={TransferScreen} options={{ tabBarLabel: "TRANSFERIR" }} />
      <Tab.Screen name="Soporte" component={SupportScreen} options={{ tabBarLabel: "SOPORTE" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <CoinsProvider>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#FFD700",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
          cardStyle: { backgroundColor: "#1a1a1a" },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="IdentityVerification"
          component={IdentityVerificationScreen}
          options={{ title: "Verificación de Identidad", headerBackTitle: "Atrás" }}
        />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ 
          title: "Mi Perfil", 
          headerStyle: { backgroundColor: "#1a1a1a" }, 
          headerTintColor: "#FFD700" 
        }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ 
          title: "Editar Perfil", 
          headerStyle: { backgroundColor: "#1a1a1a" }, 
          headerTintColor: "#FFD700" 
        }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ 
          title: "Mi Cartera", 
          headerStyle: { backgroundColor: "#1a1a1a" }, 
          headerTintColor: "#FFD700" 
        }} />
        
        {/* AGREGAR ESTA PANTALLA */}
        <Stack.Screen name="BuyCoinsScreen" component={BuyCoinsScreen} options={{ 
          title: "Comprar Fichas", 
          headerStyle: { backgroundColor: "#1a1a1a" }, 
          headerTintColor: "#FFD700" 
        }} />

        <Stack.Screen name="Transferir" component={TransferScreen} options={{ 
        title: "Recargar Fichas", 
        headerStyle: { backgroundColor: "#1a1a1a" }, 
        headerTintColor: "#FFD700" 
      }} />
      </Stack.Navigator>
    </CoinsProvider>
  );
}