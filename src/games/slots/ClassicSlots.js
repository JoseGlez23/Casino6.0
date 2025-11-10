// src/games/slots/ClassicSlots.js
import React, { useState, useEffect, useRef } from "react";
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

// Hook de sonidos para Classic Slots
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});
  const soundsRef = useRef({});

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
        { key: "maquinita", file: require("../../assets/sounds/maquinita.mp3") },
      ];

      for (const { key, file } of soundTypes) {
        try {
          const { sound } = await Audio.Sound.createAsync(file);
          soundObjects[key] = sound;
        } catch (error) {
          console.log(`Error cargando sonido ${key}:`, error);
        }
      }

      setSounds(soundObjects);
      soundsRef.current = soundObjects;
    } catch (error) {
      console.log("Error inicializando sistema de sonido:", error);
    }
  };

  const playSound = async (type) => {
    try {
      const sound = soundsRef.current[type];
      if (sound) {
        await sound.stopAsync();
        await sound.playAsync();
      }
    } catch (error) {
      console.log(`Error reproduciendo sonido ${type}:`, error);
    }
  };

  const stopAllSounds = async () => {
    try {
      for (const sound of Object.values(soundsRef.current)) {
        if (sound) {
          await sound.stopAsync();
        }
      }
    } catch (error) {
      console.log("Error stopping sounds:", error);
    }
  };

  useEffect(() => {
    loadSounds();

    return () => {
      Object.values(soundsRef.current).forEach((sound) => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  return { playSound, stopAllSounds };
};

// Componente de animación de victoria
const WinAnimation = ({ show, amount, isJackpot = false }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

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
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
      fadeAnim.setValue(0);
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
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
        <Ionicons name="trophy" size={80} color="#FFD700" />
      </Animated.View>
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
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
      fadeAnim.setValue(0);
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
          opacity: fadeAnim,
        },
      ]}
    >
      <Ionicons name="sad-outline" size={80} color="#EF4444" />
      <Text style={styles.loseAnimationText}>¡SIGUE INTENTANDO!</Text>
    </Animated.View>
  );
};

// Símbolos del juego Classic Slots
const symbols = [
  {
    id: "seven",
    name: "Siete",
    multiplier: 50, // JACKPOT
    emoji: "7️⃣",
    color: "#FFD700",
  },
  {
    id: "diamond",
    name: "Diamante",
    multiplier: 25,
    emoji: "💎",
    color: "#4CC9F0",
  },
  {
    id: "bell",
    name: "Campana",
    multiplier: 15,
    emoji: "🔔",
    color: "#FF6B6B",
  },
  {
    id: "grapes",
    name: "Uvas",
    multiplier: 10,
    emoji: "🍇",
    color: "#A78BFA",
  },
  {
    id: "cherry",
    name: "Cereza",
    multiplier: 8,
    emoji: "🍒",
    color: "#EF476F",
  },
  {
    id: "orange",
    name: "Naranja",
    multiplier: 6,
    emoji: "🍊",
    color: "#FF9E00",
  },
  {
    id: "lemon",
    name: "Limón",
    multiplier: 4,
    emoji: "🍋",
    color: "#FFD166",
  },
  {
    id: "clover",
    name: "Trébol",
    multiplier: 3,
    emoji: "🍀",
    color: "#06D6A0",
  },
];

// LÓGICA DE TRAGAMONEDAS
const calculateWin = (reels, betAmount) => {
  const lines = [
    [0, 1, 2], // Línea central
  ];

  let totalTickets = 0;
  let winningLines = [];

  lines.forEach((line, lineIndex) => {
    const symbolsInLine = line.map(
      (reelIndex, position) => reels[position][reelIndex]
    );

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

  // Premios por combinaciones parciales (dobles)
  if (reels[0][1] === reels[1][1] || reels[1][1] === reels[2][1]) {
    const matchingSymbol = reels[1][1];
    const winAmount = betAmount * 2;
    totalTickets += winAmount;
    winningLines.push({
      line: 1,
      symbol: matchingSymbol,
      amount: winAmount,
      type: "partial",
    });
  }

  return {
    tickets: totalTickets,
    winningLines,
    hasWin: totalTickets > 0,
  };
};

// Componente de carrete mejorado
const Reel = ({ symbols, reelIndex, isSpinning, winningLines, onReelStop }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const SYMBOL_HEIGHT = 60;
  const TOTAL_SYMBOLS = symbols.length * 10;

  useEffect(() => {
    if (isSpinning) {
      startSpinning();
    } else {
      spinAnim.setValue(0);
    }
  }, [isSpinning]);

  const startSpinning = () => {
    spinAnim.setValue(0);

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1200 + reelIndex * 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && onReelStop) {
        onReelStop(reelIndex);
      }
    });
  };

  const translateYInterpolation = spinAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [-TOTAL_SYMBOLS * SYMBOL_HEIGHT, -150, -30, 0],
  });

  const opacityInterpolation = spinAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0.8, 0.6, 0.6, 1],
  });

  return (
    <View style={styles.reelColumn}>
      <Animated.View
        style={[
          styles.reelContainer,
          {
            transform: [{ translateY: translateYInterpolation }],
            opacity: opacityInterpolation,
          },
        ]}
      >
        {[...symbols, ...symbols].map((symbol, symbolIndex) => {
          const actualSymbolIndex = symbolIndex % symbols.length;
          const actualSymbol = symbols[actualSymbolIndex];
          const isWinningSymbol = winningLines.some((winLine) => {
            return winLine.line === 0; // Solo línea central
          });

          return (
            <View
              key={symbolIndex}
              style={[
                styles.symbolSlot,
                isWinningSymbol && styles.winningSymbol,
                isSpinning && styles.spinningSymbol,
              ]}
            >
              <Text style={[styles.symbolEmoji, { color: actualSymbol.color }]}>
                {actualSymbol.emoji}
              </Text>
              {isWinningSymbol && <View style={styles.winningGlow} />}
            </View>
          );
        })}
      </Animated.View>
      <View style={styles.reelFrame} />
    </View>
  );
};

export default function ClassicSlots({ navigation }) {
  const { manekiCoins, tickets, addTickets, subtractCoins, canAfford } =
    useCoins();
  const { playSound, stopAllSounds } = useGameSounds();

  // Estado del juego
  const [reels, setReels] = useState([
    [symbols[0], symbols[1], symbols[2]],
    [symbols[1], symbols[2], symbols[3]],
    [symbols[2], symbols[3], symbols[4]],
  ]);

  const [spinning, setSpinning] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [bet, setBet] = useState(25);
  const [lastWin, setLastWin] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [winningLines, setWinningLines] = useState([]);
  const [stoppedReels, setStoppedReels] = useState(0);
  const [jackpot, setJackpot] = useState(10000);

  const betAmounts = [10, 25, 50, 100];
  const [pulseAnim] = useState(new Animated.Value(1));
  const cooldownRef = useRef(false);

  // Efecto para inicializar audio
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log("Error inicializando audio:", error);
      }
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

  const startCooldown = () => {
    setCooldown(true);
    cooldownRef.current = true;

    setTimeout(() => {
      setCooldown(false);
      cooldownRef.current = false;
    }, 2000);
  };

  const handleReelStop = async (reelIndex) => {
    setStoppedReels((prev) => prev + 1);

    if (reelIndex < 2) {
      await playSound("reelStop");
    }
  };

  const spinReels = async () => {
    if (spinning || !canAfford(bet) || cooldownRef.current) {
      if (!canAfford(bet)) {
        await playSound("error");
        Alert.alert(
          "Fondos Insuficientes",
          "No tienes suficientes Maneki Coins para esta apuesta"
        );
      } else if (cooldownRef.current) {
        await playSound("error");
      }
      return;
    }

    // INICIAR SPIN
    setSpinning(true);
    setCooldown(true);
    setStoppedReels(0);
    await subtractCoins(bet, `Apuesta en Classic Slots`);
    setLastWin(0);
    setWinningLines([]);

    // Contribución al jackpot
    setJackpot((prev) => prev + bet * 0.15);

    // SONIDOS INICIALES
    await playSound("click");
    await playSound("maquinita");
    pulseAnimation();

    // Generar nuevos resultados después de un delay
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

      // Calcular ganancias
      const winResult = calculateWin(newReels, bet);
      
      // Verificar jackpot (tres sietes)
      const isJackpot = 
        newReels[0][1].id === "seven" && 
        newReels[1][1].id === "seven" && 
        newReels[2][1].id === "seven";

      let finalWinAmount = winResult.tickets;
      
      if (isJackpot) {
        finalWinAmount = jackpot;
        setJackpot(10000); // Reset jackpot
      }

      if (finalWinAmount > 0) {
        setLastWin(finalWinAmount);
        setWinningLines(winResult.winningLines);
        await addTickets(finalWinAmount, `Ganancia en Classic Slots`);

        if (isJackpot) {
          await playSound("jackpot");
          triggerWinAnimation(true);
          Vibration.vibrate([500, 200, 500, 200, 500]);
          Alert.alert("🎊 JACKPOT! 🎊", "¡TRIPLE 7! ¡Felicidades! Ganaste el Jackpot!");
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

      // FINALIZAR SPIN Y INICIAR COOLDOWN
      setTimeout(() => {
        setSpinning(false);
        startCooldown();
      }, 1000);
    }, 1800);
  };

  const renderReel = (reelSymbols, reelIndex) => (
    <Reel
      key={reelIndex}
      symbols={reelSymbols}
      reelIndex={reelIndex}
      isSpinning={spinning}
      winningLines={winningLines}
      onReelStop={handleReelStop}
    />
  );

  const canSpin = !spinning && !cooldown && canAfford(bet);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animaciones */}
      <WinAnimation
        show={showWinAnimation}
        amount={lastWin}
        isJackpot={lastWin === jackpot}
      />
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

        {/* Máquina tragamonedas */}
        <View style={styles.slotsMachine}>
          <View style={styles.machineHeader}>
            <Text style={styles.machineTitle}>TRAGAMONEDAS CLÁSICA</Text>
          </View>

          {/* Área de carretes */}
          <View style={styles.reelsArea}>
            <View style={styles.reelsRow}>
              {reels.map((reelSymbols, index) =>
                renderReel(reelSymbols, index)
              )}
            </View>

            {/* Línea de pago central */}
            <View style={[styles.payline, styles.paylineMiddle]} />

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
                {lastWin > 0 ? `${lastWin} T` : "---"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>JACKPOT</Text>
              <Text style={styles.infoValue}>{jackpot} T</Text>
            </View>
          </View>
        </View>

        {/* Selector de apuesta */}
        <View style={styles.betSection}>
          <Text style={styles.betTitle}>SELECCIONAR APUESTA</Text>
          <View style={styles.betAmountsContainer}>
            {betAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.betButton,
                  !canAfford(amount) && styles.disabledButton,
                  bet === amount && styles.selectedBet,
                  cooldown && styles.cooldownButton,
                ]}
                onPress={async () => {
                  if (canAfford(amount) && !cooldown) {
                    setBet(amount);
                    await playSound("click");
                  } else {
                    await playSound("error");
                  }
                }}
                disabled={!canAfford(amount) || cooldown}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
                <Text style={styles.betButtonSubtext}>MC</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de giro principal */}
        <TouchableOpacity
          style={[styles.spinButton, !canSpin && styles.spinButtonDisabled]}
          onPress={spinReels}
          disabled={!canSpin}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={spinning ? "sync" : cooldown ? "timer" : "play"}
              size={28}
              color="#FFF"
            />
            <Text style={styles.spinButtonText}>
              {spinning ? "GIRANDO..." : cooldown ? "PREPARANDO..." : "JUGAR"}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Indicador de cooldown */}
        {cooldown && (
          <View style={styles.cooldownIndicator}>
            <Ionicons name="timer" size={16} color="#FFD700" />
            <Text style={styles.cooldownText}>
              Preparando siguiente tirada...
            </Text>
          </View>
        )}

        {/* Tabla de pagos */}
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutTitle}>TABLA DE PAGOS</Text>
          <View style={styles.payoutGrid}>
            {symbols.map((symbol) => (
              <View key={symbol.id} style={styles.payoutItem}>
                <Text style={[styles.payoutEmoji, { color: symbol.color }]}>
                  {symbol.emoji}
                </Text>
                <Text style={styles.payoutMultiplier}>
                  x{symbol.multiplier}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.payoutNote}>
            3 símbolos iguales en línea central | 2 símbolos = x2
          </Text>
          <Text style={styles.jackpotNote}>
            🎯 TRIPLE 7️⃣ = JACKPOT 🎯
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
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  emptySpace: {
    width: 40,
  },
  // Estilos de la tragamonedas clásica
  slotsMachine: {
    backgroundColor: "#8B0000",
    borderRadius: 20,
    padding: 0,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#FFD700",
    overflow: "hidden",
  },
  machineHeader: {
    backgroundColor: "#FFD700",
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
    backgroundColor: "#1a1a1a",
    padding: 15,
    position: "relative",
    height: 220,
    overflow: "hidden",
  },
  reelsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    height: 170,
    overflow: "hidden",
  },
  reelColumn: {
    flex: 1,
    alignItems: "center",
    position: "relative",
    height: 170,
    overflow: "hidden",
  },
  reelContainer: {
    alignItems: "center",
    width: "100%",
    height: 1200, // Más alto para efecto de giro
  },
  symbolSlot: {
    width: 80,
    height: 60,
    backgroundColor: "#2a2a2a",
    marginVertical: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD700",
    position: "relative",
  },
  spinningSymbol: {
    opacity: 0.9,
  },
  winningSymbol: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderColor: "#FFD700",
  },
  winningGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 8,
  },
  symbolEmoji: {
    fontSize: 32,
  },
  reelFrame: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#FFD700",
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
    height: 3,
    backgroundColor: "#00FF00",
    zIndex: 1,
    opacity: 0.8,
  },
  paylineMiddle: {
    top: "50%",
  },
  infoPanel: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: "#FFD700",
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
    width: "100%",
    alignSelf: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1,
  },
  betAmountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  betButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 70,
    flex: 1,
    marginHorizontal: 2,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
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
    backgroundColor: "#FFD700",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5B800",
    marginBottom: 16,
    width: "100%",
    alignSelf: "center",
  },
  spinButtonDisabled: {
    backgroundColor: "#666",
    borderColor: "#444",
  },
  spinButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
    marginTop: 4,
  },
  // Cooldown
  cooldownIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    marginBottom: 20,
    width: "100%",
    alignSelf: "center",
  },
  cooldownText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  cooldownButton: {
    opacity: 0.6,
  },
  // Tabla de pagos
  payoutInfo: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    width: "100%",
    alignSelf: "center",
  },
  payoutTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  payoutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  payoutItem: {
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    minWidth: 70,
    flex: 1,
    marginHorizontal: 2,
  },
  payoutEmoji: {
    fontSize: 24,
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
    marginBottom: 4,
  },
  jackpotNote: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 10,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  // Animaciones
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