// src/games/slots/AnimalSlots.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Vibration,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Hook de sonidos para Animal Slots
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundObjects = {};

      const soundTypes = [
        { key: "spin", file: require("../../assets/sounds/slots1.mp3") },
        { key: "win", file: require("../../assets/sounds/success.mp3") },
        { key: "jackpot", file: require("../../assets/sounds/slots2.mp3") },
        { key: "click", file: require("../../assets/sounds/click.mp3") },
        { key: "coin", file: require("../../assets/sounds/coin.mp3") },
        { key: "error", file: require("../../assets/sounds/error.mp3") },
        { key: "reelStop", file: require("../../assets/sounds/retro.mp3") },
      ];

      for (const { key, file } of soundTypes) {
        try {
          const soundObject = new Audio.Sound();
          await soundObject.loadAsync(file);
          soundObjects[key] = soundObject;
        } catch (error) {
          console.log(`Error cargando sonido ${key}:`, error);
        }
      }

      setSounds(soundObjects);
    } catch (error) {
      console.log("Error inicializando sistema de sonido:", error);
    }
  };

  const playSound = async (type) => {
    try {
      if (sounds[type]) {
        await sounds[type].replayAsync();
      }
    } catch (error) {
      console.log(`Error reproduciendo sonido ${type}:`, error);
    }
  };

  useEffect(() => {
    loadSounds();

    return () => {
      Object.values(sounds).forEach((sound) => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  return playSound;
};

// Componente de animación de victoria
const WinAnimation = ({ show, amount, isJackpot = false }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.winAnimation,
        {
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <Ionicons name="trophy" size={80} color="#FFD700" />
      <Text style={styles.winAnimationText}>
        {isJackpot ? "¡JACKPOT!" : "¡GANASTE!"}
      </Text>
      <Text style={styles.winAnimationAmount}>
        +{amount.toLocaleString()} TICKETS
      </Text>
    </Animated.View>
  );
};

// Componente de animación de pérdida
const LoseAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: [0, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.loseAnimation,
        {
          transform: [{ scale: scaleAnim }, { translateX: shakeInterpolation }],
        },
      ]}
    >
      <Ionicons name="sad-outline" size={80} color="#EF4444" />
      <Text style={styles.loseAnimationText}>¡SIGUE INTENTANDO!</Text>
    </Animated.View>
  );
};

// Símbolos del juego con las imágenes que tienes
const symbols = [
  {
    id: "lion",
    name: "León",
    multiplier: 10,
    image: require("../../assets/lion.png"),
  },
  {
    id: "tiger",
    name: "Tigre",
    multiplier: 15,
    image: require("../../assets/tiger.png"),
  },
  {
    id: "elephant",
    name: "Elefante",
    multiplier: 5,
    image: require("../../assets/elephant.png"),
  },
  {
    id: "giraffe",
    name: "Jirafa",
    multiplier: 3,
    image: require("../../assets/giraffe.png"),
  },
  {
    id: "panda",
    name: "Panda",
    multiplier: 7,
    image: require("../../assets/panda.png"),
  },
  {
    id: "monkey",
    name: "Mono",
    multiplier: 2,
    image: require("../../assets/monkey.png"),
  },
];

// LÓGICA REAL DE TRAGAMONEDAS
const calculateWin = (reels, betAmount) => {
  const lines = [
    [0, 1, 2], // Línea central
    [0, 0, 0], // Línea superior
    [2, 2, 2], // Línea inferior
  ];

  let totalTickets = 0;
  let winningLines = [];

  // Verificar cada línea de pago
  lines.forEach((line, lineIndex) => {
    const symbolsInLine = line.map(
      (reelIndex, position) => reels[position][reelIndex]
    );

    // Verificar si todos los símbolos son iguales
    const firstSymbol = symbolsInLine[0];
    const allSame = symbolsInLine.every(
      (symbol) => symbol.id === firstSymbol.id
    );

    if (allSame) {
      const winAmount = betAmount * firstSymbol.multiplier;
      totalTickets += winAmount;
      winningLines.push({
        line: lineIndex,
        symbol: firstSymbol,
        amount: winAmount,
      });
    }
  });

  return {
    tickets: totalTickets,
    winningLines,
    hasWin: totalTickets > 0,
  };
};

export default function AnimalSlots({ navigation }) {
  const { manekiCoins, tickets, addTickets, subtractCoins, canAfford } =
    useCoins();
  const playSound = useGameSounds();

  // Estado para 3 carretes con 3 símbolos visibles cada uno
  const [reels, setReels] = useState([
    [symbols[0], symbols[1], symbols[2]], // Carrete 1
    [symbols[1], symbols[2], symbols[3]], // Carrete 2
    [symbols[2], symbols[3], symbols[4]], // Carrete 3
  ]);

  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(50);
  const [lastWin, setLastWin] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [winningLines, setWinningLines] = useState([]);

  // Animaciones para cada carrete
  const [reelAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const betAmounts = [25, 50, 100, 250];
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const initializeAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    initializeAudio();
  }, []);

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerWinAnimation = (isJackpot = false) => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2500);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2000);
  };

  const spinReels = async () => {
    if (spinning || !canAfford(bet)) {
      if (!canAfford(bet)) {
        await playSound("error");
        Alert.alert(
          "Fondos Insuficientes",
          "No tienes suficientes Maneki Coins para esta apuesta"
        );
      }
      return;
    }

    setSpinning(true);
    subtractCoins(bet, `Apuesta en Animal Slots`);
    setLastWin(0);
    setWinningLines([]);

    await playSound("click");
    await playSound("spin"); // Sonido de giro continuo
    pulseAnimation();

    // Animación de giro de los carretes - EFECTO REAL DE TRAGAMONEDAS
    reelAnimations.forEach((anim, index) => {
      anim.setValue(0);

      // Efecto de giro rápido al inicio
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000 + index * 400, // Cada carrete para en momentos diferentes
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Sonido cuando para cada carrete
      setTimeout(async () => {
        await playSound("reelStop");
      }, 800 + index * 400);
    });

    // Generar nuevos resultados después de la animación
    setTimeout(async () => {
      const newReels = [
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
      ];

      setReels(newReels);

      // Calcular ganancias con la nueva lógica
      const winResult = calculateWin(newReels, bet);

      if (winResult.hasWin) {
        setLastWin(winResult.tickets);
        setWinningLines(winResult.winningLines);

        // Agregar tickets ganados
        await addTickets(winResult.tickets, `Ganancia en Animal Slots`);

        // Verificar si es jackpot (3 tigres en línea central)
        const isJackpot = winResult.winningLines.some(
          (line) => line.symbol.id === "tiger" && line.line === 0
        );

        if (isJackpot) {
          await playSound("jackpot");
          triggerWinAnimation(true);
          Vibration.vibrate([500, 200, 500, 200, 500]);
        } else {
          await playSound("win");
          triggerWinAnimation(false);
          Vibration.vibrate([0, 300, 100, 300]);
        }
      } else {
        await playSound("error");
        triggerLoseAnimation();
        Vibration.vibrate(200);
      }

      setSpinning(false);
    }, 2000);
  };

  const renderReel = (reelSymbols, reelIndex) => {
    const reelAnimation = {
      transform: [
        {
          translateY: reelAnimations[reelIndex].interpolate({
            inputRange: [0, 1],
            outputRange: [-200, 0],
          }),
        },
      ],
    };

    return (
      <View key={reelIndex} style={styles.reelColumn}>
        <Animated.View style={[styles.reelContainer, reelAnimation]}>
          {reelSymbols.map((symbol, symbolIndex) => {
            // Verificar si este símbolo está en una línea ganadora
            const isWinningSymbol = winningLines.some((winLine) => {
              const linePositions = [
                [0, 0, 0],
                [0, 1, 2],
                [2, 2, 2],
              ]; // superior, central, inferior
              return linePositions[winLine.line][reelIndex] === symbolIndex;
            });

            return (
              <View
                key={symbolIndex}
                style={[
                  styles.symbolSlot,
                  isWinningSymbol && styles.winningSymbol,
                ]}
              >
                <Image source={symbol.image} style={styles.symbolImage} />
              </View>
            );
          })}
        </Animated.View>

        {/* Marco del carrete */}
        <View style={styles.reelFrame} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animaciones */}
      <WinAnimation
        show={showWinAnimation}
        amount={lastWin}
        isJackpot={lastWin >= bet * 15} // Jackpot si gana 15x o más
      />

      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header simplificado */}
        <View style={styles.header}>
          <View style={styles.balances}>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/dinero.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>
                {manekiCoins.toLocaleString()} MC
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/TICKET.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>
                {tickets.toLocaleString()} T
              </Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}></Text>
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Área de la tragamonedas - DISEÑO REAL */}
        <View style={styles.slotsMachine}>
          {/* Panel superior */}
          <View style={styles.machineHeader}>
            <Text style={styles.machineTitle}>SAFARI SLOTS</Text>
          </View>

          {/* Área de carretes */}
          <View style={styles.reelsArea}>
            <View style={styles.reelsRow}>
              {reels.map((reelSymbols, index) =>
                renderReel(reelSymbols, index)
              )}
            </View>

            {/* Líneas de pago */}
            <View style={[styles.payline, styles.paylineTop]} />
            <View style={[styles.payline, styles.paylineMiddle]} />
            <View style={[styles.payline, styles.paylineBottom]} />

            {/* Marco de la ventana */}
            <View style={styles.windowFrame} />
          </View>

          {/* Panel de información */}
          <View style={styles.infoPanel}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>APUESTA</Text>
              <Text style={styles.infoValue}>{bet} MC</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>PREMIO</Text>
              <Text style={styles.infoValue}>
                {lastWin > 0 ? `${lastWin} TICKETS` : "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* Selector de apuesta - ABAJO DEL SLOT */}
        <View style={styles.betSection}>
          <Text style={styles.betTitle}>SELECCIONAR APUESTA</Text>
          <View style={styles.betAmounts}>
            {betAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.betButton,
                  !canAfford(amount) && styles.disabledButton,
                  bet === amount && styles.selectedBet,
                ]}
                onPress={async () => {
                  if (canAfford(amount)) {
                    setBet(amount);
                    await playSound("click");
                    pulseAnimation();
                  } else {
                    await playSound("error");
                  }
                }}
                disabled={!canAfford(amount)}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
                <Text style={styles.betButtonSubtext}>MC</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de giro principal */}
        <TouchableOpacity
          style={[
            styles.spinButton,
            (spinning || !canAfford(bet)) && styles.spinButtonDisabled,
          ]}
          onPress={spinReels}
          disabled={spinning || !canAfford(bet)}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={spinning ? "sync" : "play"}
              size={28}
              color="#FFF"
            />
            <Text style={styles.spinButtonText}>
              {spinning ? "GIRANDO..." : "JUGAR"}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Tabla de pagos */}
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutTitle}>TABLA DE PAGOS</Text>
          <View style={styles.payoutGrid}>
            <View style={styles.payoutItem}>
              <Image
                source={require("../../assets/tiger.png")}
                style={styles.payoutImage}
              />
              <Text style={styles.payoutMultiplier}>x15</Text>
            </View>
            <View style={styles.payoutItem}>
              <Image
                source={require("../../assets/lion.png")}
                style={styles.payoutImage}
              />
              <Text style={styles.payoutMultiplier}>x10</Text>
            </View>
            <View style={styles.payoutItem}>
              <Image
                source={require("../../assets/panda.png")}
                style={styles.payoutImage}
              />
              <Text style={styles.payoutMultiplier}>x7</Text>
            </View>
            <View style={styles.payoutItem}>
              <Image
                source={require("../../assets/elephant.png")}
                style={styles.payoutImage}
              />
              <Text style={styles.payoutMultiplier}>x5</Text>
            </View>
          </View>
          <Text style={styles.payoutNote}>
            3 símbolos iguales en línea de pago
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  balances: {
    flexDirection: "row",
    gap: 12,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    gap: 6,
  },
  balanceIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    color: "#FF9800",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  emptySpace: {
    width: 40,
  },
  // Estilos de la tragamonedas
  slotsMachine: {
    backgroundColor: "#2D3748",
    borderRadius: 20,
    padding: 0,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#FF9800",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  machineHeader: {
    backgroundColor: "#FF9800",
    paddingVertical: 10,
    alignItems: "center",
  },
  machineTitle: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  reelsArea: {
    backgroundColor: "#1A202C",
    padding: 15,
    position: "relative",
    height: 200,
  },
  reelsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    height: 150,
    overflow: "hidden",
  },
  reelColumn: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  reelContainer: {
    alignItems: "center",
    width: "100%",
  },
  symbolSlot: {
    width: 80,
    height: 50,
    backgroundColor: "#2D3748",
    marginVertical: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  winningSymbol: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderColor: "#FFD700",
  },
  symbolImage: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  reelFrame: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#FF9800",
    borderRadius: 10,
    pointerEvents: "none",
  },
  windowFrame: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 12,
    pointerEvents: "none",
  },
  payline: {
    position: "absolute",
    left: 15,
    right: 15,
    height: 2,
    backgroundColor: "#FFD700",
    zIndex: 1,
    opacity: 0.6,
  },
  paylineTop: {
    top: "20%",
  },
  paylineMiddle: {
    top: "50%",
  },
  paylineBottom: {
    top: "80%",
  },
  infoPanel: {
    flexDirection: "row",
    backgroundColor: "#1A202C",
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: "#FF9800",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoValue: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  // Sección de apuesta
  betSection: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1,
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  betButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 70,
  },
  selectedBet: {
    borderColor: "#FF9800",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
  },
  betButtonText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  betButtonSubtext: {
    color: "#FFF",
    fontSize: 10,
    marginTop: 2,
  },
  // Botón de giro
  spinButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E65100",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 20,
  },
  spinButtonDisabled: {
    backgroundColor: "#666",
    borderColor: "#444",
  },
  spinButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
    marginTop: 4,
  },
  // Tabla de pagos
  payoutInfo: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  payoutTitle: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  payoutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  payoutItem: {
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    minWidth: 70,
  },
  payoutImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginBottom: 4,
  },
  payoutMultiplier: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  payoutNote: {
    color: "#FFF",
    fontSize: 10,
    textAlign: "center",
    opacity: 0.7,
  },
  bottomSpacer: {
    height: 10,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  // Estilos para animaciones
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -120,
    marginTop: -100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    width: 240,
    height: 200,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winAnimationText: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  winAnimationAmount: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  loseAnimationText: {
    color: "#EF4444",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});
