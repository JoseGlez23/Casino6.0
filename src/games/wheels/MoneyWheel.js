// src/games/wheels/MoneyWheel.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

// Secciones de la rueda CORREGIDAS - ORDEN Y COLORES ACTUALIZADOS
const WHEEL_SECTIONS = [
  { label: "x10", multiplier: 10, color: "#54A0FF", ticketsMultiplier: 10 }, // Azul - Gana máximo
  {
    label: "x0.25",
    multiplier: 0.25,
    color: "#FF9F43",
    ticketsMultiplier: 0.25,
  }, // Naranja - Pierde 75%
  { label: "x2", multiplier: 2, color: "#FF9FF3", ticketsMultiplier: 2 }, // Rosa - Gana normal
  { label: "x0", multiplier: 0, color: "#95E1D3", ticketsMultiplier: 0 }, // Verde claro - Pierde todo
  { label: "BUST", multiplier: 0, color: "#576574", ticketsMultiplier: 0 }, // Gris oscuro - Pierde todo
  { label: "x0.5", multiplier: 0.5, color: "#4ECDC4", ticketsMultiplier: 0.5 }, // Turquesa - Pierde mitad
  { label: "x5", multiplier: 5, color: "#FFD700", ticketsMultiplier: 5 }, // Amarillo - Gana mucho
  { label: "x1", multiplier: 1, color: "#FF6B6B", ticketsMultiplier: 1 }, // Rojo - Recupera en tickets
];

// Hook de sonidos profesional
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});
  const [currentSound, setCurrentSound] = useState(null);

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
        { key: "click", file: require("../../assets/sounds/click.mp3") },
        { key: "coin", file: require("../../assets/sounds/coin.mp3") },
        { key: "error", file: require("../../assets/sounds/error.mp3") },
        { key: "success", file: require("../../assets/sounds/success.mp3") },
        { key: "slots", file: require("../../assets/sounds/slots.mp3") },
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
    } catch (error) {
      console.log("Error inicializando sonidos:", error);
    }
  };

  const playSound = async (type, duration = null) => {
    try {
      const soundMap = {
        win: "success",
        lose: "error",
        spin: "slots",
        coin: "coin",
        click: "click",
      };

      const soundKey = soundMap[type] || "click";

      if (sounds[soundKey]) {
        if (currentSound) {
          try {
            await currentSound.stopAsync();
          } catch (e) {}
        }

        const sound = sounds[soundKey];
        setCurrentSound(sound);

        await sound.replayAsync();

        if (duration) {
          setTimeout(async () => {
            try {
              await sound.stopAsync();
              setCurrentSound(null);
            } catch (error) {
              console.log("Error deteniendo sonido:", error);
            }
          }, duration);
        }
      }
    } catch (error) {
      const vibrationMap = {
        win: [0, 100, 50, 100],
        lose: [0, 300, 100, 300],
        spin: 100,
        coin: 50,
        click: 25,
      };
      Vibration.vibrate(vibrationMap[type] || 25);
    }
  };

  const stopSound = async () => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        setCurrentSound(null);
      } catch (error) {
        console.log("Error deteniendo sonido:", error);
      }
    }
  };

  useEffect(() => {
    loadSounds();
    return () => {
      Object.values(sounds).forEach((sound) => sound?.unloadAsync());
    };
  }, []);

  return { playSound, stopSound };
};

// Función para calcular tickets (MISMA LÓGICA QUE LA RULETA)
const getTicketRewards = (betAmount, multiplier = 1) => {
  // Base tickets basado en la apuesta y multiplicador
  const baseTickets = Math.floor(betAmount * 0.1); // 10% de la apuesta base
  const multiplierBonus = Math.floor((multiplier - 1) * betAmount * 0.05); // Bonus por multiplicador

  return Math.max(baseTickets + multiplierBonus, 1); // Mínimo 1 ticket
};

// Componente de animación de victoria
const WinAnimation = ({ show, ticketsWon = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (show) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

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
      pulseAnim.setValue(1);
    }
  }, [show]);

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
      <Ionicons name="trophy" size={50} color="#FFD700" />
      <Text style={styles.winText}>¡GANASTE!</Text>
      <Text style={styles.winSubtext}>Ganas tickets</Text>
      {ticketsWon > 0 && (
        <View style={styles.ticketsWonAnimationContainer}>
          <Text style={styles.ticketsWonAnimation}>+{ticketsWon} Tickets</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Componente de animación de derrota
const LoseAnimation = ({ show, message = "Sin premio esta vez" }) => {
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
      <Ionicons name="sad-outline" size={50} color="#EF4444" />
      <Text style={styles.loseText}>¡PERDISTE!</Text>
      <Text style={styles.loseSubtext}>{message}</Text>
    </Animated.View>
  );
};

// Componente mejorado para cada sección de la rueda
const WheelSection = ({ section, index, totalSections }) => {
  const angle = (360 / totalSections) * index;
  const sectionAngle = 360 / totalSections;

  const getTextColor = (backgroundColor) => {
    const lightColors = ["#FFD700", "#95E1D3", "#4ECDC4"];
    return lightColors.includes(backgroundColor) ? "#000000" : "#FFFFFF";
  };

  return (
    <View
      style={[
        styles.wheelSection,
        {
          backgroundColor: section.color,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    >
      <Text
        style={[
          styles.sectionLabel,
          {
            transform: [{ rotate: `${-angle - sectionAngle / 2}deg` }],
            color: getTextColor(section.color),
          },
        ]}
      >
        {section.label}
      </Text>
    </View>
  );
};

export default function MoneyWheel({ navigation }) {
  const { manekiCoins, tickets, subtractCoins, addTickets, canAfford } =
    useCoins();
  const { playSound, stopSound } = useGameSounds();

  const [bet, setBet] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [selectedBet, setSelectedBet] = useState(0);
  const [winningSection, setWinningSection] = useState(null);
  const [loseMessage, setLoseMessage] = useState("");

  const spinAnimation = useRef(new Animated.Value(0)).current;
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

  const triggerWinAnimation = (tickets = 0) => {
    setTicketsWon(tickets);
    setShowWinAnimation(true);
    setTimeout(() => {
      setShowWinAnimation(false);
      setTicketsWon(0);
    }, 3000);
  };

  const triggerLoseAnimation = (message = "Sin premio esta vez") => {
    setLoseMessage(message);
    setShowLoseAnimation(true);
    setTimeout(() => {
      setShowLoseAnimation(false);
      setLoseMessage("");
    }, 3000);
  };

  // Función para calcular probabilidades balanceadas (8 secciones)
  const getWeightedRandomSection = () => {
    const weights = [0.06, 0.08, 0.18, 0.14, 0.1, 0.16, 0.1, 0.18];
    const random = Math.random();
    let cumulativeWeight = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return i;
      }
    }
    return 7; // x1 como fallback
  };

  // FUNCIÓN SPINWHEEL ACTUALIZADA CON SISTEMA DE TICKETS
  const spinWheel = async (betAmount) => {
    if (!canAfford(betAmount) || spinning) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setSpinning(true);
    setResult("");
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setWinningSection(null);
    setLoseMessage("");
    setBet(betAmount);
    setSelectedBet(betAmount);

    await subtractCoins(betAmount, `Apuesta en Money Wheel`);
    await playSound("coin");
    pulseAnimation();

    const spinDuration = 4000;
    await playSound("spin", spinDuration);

    // PRIMERO determinamos qué sección debe ganar (basado en probabilidades)
    const winningIndex = getWeightedRandomSection();
    console.log(
      "Índice ganador calculado:",
      winningIndex,
      WHEEL_SECTIONS[winningIndex].label
    );

    // CÁLCULO CORREGIDO DE LA ROTACIÓN
    const sectionAngle = 360 / WHEEL_SECTIONS.length;

    // La flecha está en la parte superior (0 grados)
    // Queremos que la sección ganadora termine justo en la flecha
    // Cada sección ocupa 45 grados (360/8), y queremos que el centro quede en la flecha
    const targetSectionCenter = winningIndex * sectionAngle + sectionAngle / 2;

    // Rotación completa más la posición para que la sección quede en la flecha
    const extraRotations = 5; // Vueltas completas para efecto dramático
    const finalRotation = extraRotations * 360 + (360 - targetSectionCenter);

    console.log("Rotación final calculada:", finalRotation, "grados");

    const animationPromise = new Promise((resolve) => {
      Animated.timing(spinAnimation, {
        toValue: finalRotation,
        duration: spinDuration,
        useNativeDriver: true,
      }).start(() => {
        resolve(winningIndex);
      });
    });

    const actualWinningIndex = await animationPromise;
    setWinningSection(actualWinningIndex);

    const winMultiplier = WHEEL_SECTIONS[actualWinningIndex].multiplier;
    const ticketsMultiplier =
      WHEEL_SECTIONS[actualWinningIndex].ticketsMultiplier;

    // CALCULAR TICKETS GANADOS (USANDO LA MISMA LÓGICA QUE LA RULETA)
    const ticketsReward = getTicketRewards(betAmount, ticketsMultiplier);

    console.log(
      "Resultado final:",
      actualWinningIndex,
      WHEEL_SECTIONS[actualWinningIndex].label,
      "Tickets:",
      ticketsReward
    );

    // Determinar el mensaje y efectos según el resultado
    if (ticketsMultiplier > 1) {
      setResult(`¡${WHEEL_SECTIONS[actualWinningIndex].label} MULTIPLICADOR!`);
      await playSound("win");
      triggerWinAnimation(ticketsReward);
      await addTickets(
        ticketsReward,
        `Ganancia en Money Wheel - ${WHEEL_SECTIONS[actualWinningIndex].label}`
      );
    } else if (ticketsMultiplier === 1) {
      setResult(
        `¡${WHEEL_SECTIONS[actualWinningIndex].label} - Recuperas en tickets!`
      );
      await playSound("win");
      triggerWinAnimation(ticketsReward);
      await addTickets(ticketsReward, `Recuperación en Money Wheel`);
    } else if (ticketsMultiplier > 0 && ticketsMultiplier < 1) {
      const lostPercentage = Math.round((1 - ticketsMultiplier) * 100);
      setResult(`¡${WHEEL_SECTIONS[actualWinningIndex].label} - Pérdida!`);
      await playSound("lose");
      triggerLoseAnimation(`Pierdes el ${lostPercentage}% de tu apuesta`);
      if (ticketsReward > 0) {
        await addTickets(ticketsReward, `Recuperación parcial en Money Wheel`);
      }
    } else {
      setResult(`¡${WHEEL_SECTIONS[actualWinningIndex].label.toUpperCase()}!`);
      await playSound("lose");
      triggerLoseAnimation("Pierdes toda tu apuesta");
    }

    setSpinning(false);
  };

  const resetGame = async () => {
    setSelectedBet(0);
    setResult("");
    setTicketsWon(0);
    setWinningSection(null);
    setLoseMessage("");
    await playSound("click");
  };

  const spinRotation = spinAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} message={loseMessage} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con saldo y tickets - MISMA ESTRUCTURA QUE LA RULETA */}
        <View style={styles.header}>
          <View style={styles.balancesContainer}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.coinsDisplay}>
                  <Image
                    source={require("../../assets/dinero.png")}
                    style={styles.coinIcon}
                  />
                  <Text style={styles.balanceText}>
                    {manekiCoins.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.balanceItem}>
                <View style={styles.ticketsDisplay}>
                  <Image
                    source={require("../../assets/TICKET.png")}
                    style={styles.ticketIcon}
                  />
                  <Text style={styles.balanceText}>
                    {tickets.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.emptySpace} />
        </View>

        <View style={styles.wheelContainer}>
          <Animated.View
            style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}
          >
            <View style={styles.wheelInner}>
              {WHEEL_SECTIONS.map((section, index) => (
                <WheelSection
                  key={index}
                  section={section}
                  index={index}
                  totalSections={WHEEL_SECTIONS.length}
                />
              ))}
            </View>
            <View style={styles.wheelCenter}>
              <Text style={styles.wheelCenterText}>💰</Text>
            </View>
          </Animated.View>

          <View style={styles.pointer} />
        </View>

        {winningSection !== null && !spinning && (
          <View
            style={[
              styles.winningSectionInfo,
              {
                backgroundColor: WHEEL_SECTIONS[winningSection].color + "40",
                borderColor:
                  WHEEL_SECTIONS[winningSection].ticketsMultiplier > 1
                    ? "#10B981"
                    : WHEEL_SECTIONS[winningSection].ticketsMultiplier === 1
                    ? "#F59E0B"
                    : "#EF4444",
              },
            ]}
          >
            <View
              style={[
                styles.winningColor,
                { backgroundColor: WHEEL_SECTIONS[winningSection].color },
              ]}
            />
            <Text style={styles.winningText}>
              Sección: {WHEEL_SECTIONS[winningSection].label}
            </Text>
          </View>
        )}

        {result && !spinning && (
          <Animated.View
            style={[
              styles.messageContainer,
              {
                transform: [{ scale: pulseAnim }],
                borderColor:
                  WHEEL_SECTIONS[winningSection]?.ticketsMultiplier > 1
                    ? "#10B981"
                    : WHEEL_SECTIONS[winningSection]?.ticketsMultiplier === 1
                    ? "#F59E0B"
                    : "#EF4444",
                backgroundColor:
                  WHEEL_SECTIONS[winningSection]?.ticketsMultiplier > 1
                    ? "rgba(16, 185, 129, 0.1)"
                    : WHEEL_SECTIONS[winningSection]?.ticketsMultiplier === 1
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
              },
            ]}
          >
            <Text
              style={[
                styles.result,
                {
                  color:
                    WHEEL_SECTIONS[winningSection]?.ticketsMultiplier > 1
                      ? "#10B981"
                      : WHEEL_SECTIONS[winningSection]?.ticketsMultiplier === 1
                      ? "#F59E0B"
                      : "#EF4444",
                },
              ]}
            >
              {result}
            </Text>
            {ticketsWon > 0 && (
              <View style={styles.ticketsWonContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
                <Text style={styles.ticketsCalculation}>
                  ({selectedBet} MC x{" "}
                  {WHEEL_SECTIONS[winningSection]?.ticketsMultiplier}{" "}
                  multiplicador)
                </Text>
              </View>
            )}
            {selectedBet > 0 && (
              <Text style={styles.betInfo}>
                Apuesta: {selectedBet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        <View style={styles.controls}>
          <Text style={styles.betTitle}>SELECCIONA TU APUESTA</Text>
          <View style={styles.betButtons}>
            {betAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.betButton,
                  (!canAfford(amount) || spinning) && styles.disabledButton,
                  selectedBet === amount && styles.selectedBet,
                ]}
                onPress={async () => {
                  if (canAfford(amount) && !spinning) {
                    setSelectedBet(amount);
                    await playSound("click");
                    pulseAnimation();
                  }
                }}
                disabled={!canAfford(amount) || spinning}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
                <Text style={styles.ticketRewardInfo}>
                  +{getTicketRewards(amount, 2)} tickets
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.currentBet}>
            {selectedBet > 0
              ? `Apuesta: ${selectedBet.toLocaleString()} MC`
              : "Selecciona monto"}
          </Text>

          <TouchableOpacity
            style={[
              styles.spinButton,
              (selectedBet === 0 || spinning) && styles.disabledButton,
            ]}
            onPress={() => selectedBet > 0 && spinWheel(selectedBet)}
            disabled={selectedBet === 0 || spinning}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.spinButtonText}>
              {spinning ? "GIRANDO..." : "GIRAR RUEDA"}
            </Text>
          </TouchableOpacity>

          {!spinning && result && (
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Ionicons name="play" size={16} color="#FFF" />
              <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>TABLA DE PREMIOS Y RIESGOS</Text>
          <View style={styles.payoutGrid}>
            {WHEEL_SECTIONS.map((section, index) => (
              <View key={index} style={styles.payoutItem}>
                <View
                  style={[
                    styles.payoutColor,
                    { backgroundColor: section.color },
                  ]}
                />
                <View style={styles.payoutInfo}>
                  <Text
                    style={[
                      styles.payoutText,
                      section.multiplier > 1
                        ? styles.winText
                        : section.multiplier === 1
                        ? styles.neutralText
                        : styles.loseText,
                    ]}
                  >
                    {section.label}
                  </Text>
                  <Text
                    style={[
                      styles.payoutMultiplier,
                      section.multiplier > 1
                        ? styles.winMultiplier
                        : section.multiplier === 1
                        ? styles.neutralMultiplier
                        : styles.loseMultiplier,
                    ]}
                  >
                    {section.ticketsMultiplier > 1
                      ? `Gana x${section.ticketsMultiplier}`
                      : section.ticketsMultiplier === 1
                      ? "Recupera en tickets"
                      : section.ticketsMultiplier > 0
                      ? `Pierde ${Math.round(
                          (1 - section.ticketsMultiplier) * 100
                        )}%`
                      : "BUST - Pierde todo"}
                  </Text>
                  <Text style={styles.ticketRewardSmall}>
                    +{getTicketRewards(100, section.ticketsMultiplier)} tickets
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.payoutsNote}>
            Premios en tickets = Apuesta x Multiplicador + Bonus
          </Text>
        </View>
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  // Header con saldo y tickets - MISMA ESTRUCTURA QUE LA RULETA
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  balancesContainer: {
    flex: 1,
  },
  balanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  balanceItem: {
    alignItems: "flex-start",
  },
  coinsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 5,
    minWidth: 80,
  },
  ticketsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 5,
    minWidth: 80,
  },
  coinIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  ticketIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    top: 0,
  },
  title: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#FFF",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 2,
  },
  emptySpace: {
    width: 80,
  },
  wheelContainer: {
    position: "relative",
    marginBottom: 20,
    alignItems: "center",
  },
  wheel: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#2b2b2b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#FFD700",
    elevation: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  wheelInner: {
    width: 265,
    height: 265,
    borderRadius: 132.5,
    overflow: "hidden",
    position: "relative",
  },
  wheelSection: {
    position: "absolute",
    width: "50%",
    height: "50%",
    left: "50%",
    top: 0,
    transformOrigin: "left bottom",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  wheelCenter: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  wheelCenterText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pointer: {
    position: "absolute",
    top: -5,
    left: "50%",
    marginLeft: -15,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFD700",
    zIndex: 10,
  },
  winningSectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "center",
    borderWidth: 2,
  },
  winningColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  winningText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 12,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
  },
  result: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  ticketsWonContainer: {
    alignItems: "center",
    marginTop: 5,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
  },
  ticketsCalculation: {
    color: "#10B981",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  betInfo: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 6,
    opacity: 0.8,
  },
  controls: {
    alignItems: "center",
    marginBottom: 20,
  },
  betTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  betButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  betButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 70,
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
  ticketRewardInfo: {
    color: "#10B981",
    fontSize: 9,
    marginTop: 2,
    fontStyle: "italic",
    textAlign: "center",
    fontWeight: "bold",
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  spinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 8,
    marginBottom: 10,
  },
  spinButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  payouts: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  payoutsTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  payoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  payoutItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  payoutColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  payoutMultiplier: {
    fontSize: 10,
  },
  ticketRewardSmall: {
    color: "#10B981",
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 1,
  },
  winText: {
    color: "#10B981",
  },
  winMultiplier: {
    color: "#10B981",
  },
  neutralText: {
    color: "#F59E0B",
  },
  neutralMultiplier: {
    color: "#F59E0B",
  },
  loseText: {
    color: "#EF4444",
  },
  loseMultiplier: {
    color: "#EF4444",
  },
  payoutsNote: {
    color: "#10B981",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -80,
    marginTop: -60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 3,
    width: 160,
    height: 120,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
  },
  loseText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
  },
  winSubtext: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  loseSubtext: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  ticketsWonAnimationContainer: {
    marginTop: 5,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonAnimation: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
