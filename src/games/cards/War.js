// src/games/cards/War.js
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

// Hook de sonidos para War - IGUAL QUE EN POKER
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
        { key: "card", file: require("../../assets/sounds/card.mp3") },
        { key: "click", file: require("../../assets/sounds/click.mp3") },
        { key: "coin", file: require("../../assets/sounds/coin.mp3") },
        { key: "error", file: require("../../assets/sounds/error.mp3") },
        { key: "success", file: require("../../assets/sounds/success.mp3") },
      ];

      for (const { key, file } of soundTypes) {
        try {
          const soundObject = new Audio.Sound();
          await soundObject.loadAsync(file);
          soundObjects[key] = soundObject;
        } catch (error) {
          console.log(` Error cargando sonido ${key}:`, error);
        }
      }

      setSounds(soundObjects);
    } catch (error) {
      console.log(" Error inicializando sistema de sonido:", error);
    }
  };

  const playSound = async (type) => {
    try {
      let soundKey;
      switch (type) {
        case "win":
          soundKey = "success";
          break;
        case "lose":
          soundKey = "error";
          break;
        case "card":
          soundKey = "card";
          break;
        case "chip":
        case "coin":
          soundKey = "coin";
          break;
        case "click":
        default:
          soundKey = "click";
      }

      if (sounds[soundKey]) {
        await sounds[soundKey].replayAsync();
      } else {
        playVibration(type);
      }
    } catch (error) {
      playVibration(type);
    }
  };

  const playVibration = (type) => {
    switch (type) {
      case "win":
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
        break;
      case "lose":
        Vibration.vibrate([0, 300, 100, 300]);
        break;
      case "card":
        Vibration.vibrate(30);
        break;
      case "chip":
      case "coin":
        Vibration.vibrate(20);
        break;
      case "click":
      default:
        Vibration.vibrate(15);
    }
  };

  useEffect(() => {
    loadSounds();
    return () => {
      Object.values(sounds).forEach((sound) => {
        if (sound) sound.unloadAsync();
      });
    };
  }, []);

  return playSound;
};

// Componente de animación de victoria
const WinAnimation = ({ show }) => {
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
      <Ionicons name="trophy" size={70} color="#FFD700" />
      <Text style={styles.winText}>VICTORIA</Text>
      <Text style={styles.winSubtext}>Ganas Tickets</Text>
    </Animated.View>
  );
};

// Componente de animación de guerra
const WarAnimation = ({ show }) => {
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
          duration: 600,
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
    outputRange: [0, -15, 15, -15, 15, -15, 15, -15, 15, -15, 0],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.warAnimation,
        {
          transform: [{ scale: scaleAnim }, { translateX: shakeInterpolation }],
        },
      ]}
    >
      <Ionicons name="flash" size={70} color="#F59E0B" />
      <Text style={styles.warText}>GUERRA</Text>
      <Text style={styles.warSubtext}>Ganas Tickets x2</Text>
    </Animated.View>
  );
};

// Componente de animación de derrota
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
      <Ionicons name="sad-outline" size={70} color="#EF4444" />
      <Text style={styles.loseText}>DERROTA</Text>
      <Text style={styles.loseSubtext}>Pierdes apuesta</Text>
    </Animated.View>
  );
};

// Tabla de premios de tickets para War - SOLO TICKETS, NO MANEKI COINS
const getTicketRewards = (betAmount, isWar = false, isWin = false) => {
  if (!isWin) return 0;

  const rewards = {
    50: isWar ? 100 : 50,
    100: isWar ? 200 : 100,
    250: isWar ? 500 : 250,
    500: isWar ? 1000 : 500,
  };
  return rewards[betAmount] || 0;
};

export default function War({ navigation }) {
  const {
    manekiCoins,
    tickets,
    addCoins,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const playSound = useGameSounds();

  const [bet, setBet] = useState(0);
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [isWar, setIsWar] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showWarAnimation, setShowWarAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);

  const cardAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  const cardValues = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const dealCard = () => {
    const values = Object.keys(cardValues);
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit, numeric: cardValues[value] };
  };

  const animateCards = () => {
    cardAnimations.setValue(0);
    Animated.timing(cardAnimations, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const animateResult = () => {
    resultAnimations.setValue(0);
    Animated.spring(resultAnimations, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

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

  const triggerWinAnimation = () => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2500);
  };

  const triggerWarAnimation = () => {
    setShowWarAnimation(true);
    setTimeout(() => setShowWarAnimation(false), 2500);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2500);
  };

  const startGame = async (betAmount) => {
    if (!canAfford(betAmount)) {
      await playSound("error");
      Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins");
      return;
    }

    setBet(betAmount);
    subtractCoins(betAmount, `Apuesta en War`);
    await playSound("coin");
    pulseAnimation();
    animateCards();

    setGameState("dealing");
    setResult("");
    setIsWar(false);
    setShowWinAnimation(false);
    setShowWarAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);

    setTimeout(async () => {
      const newPlayerCard = dealCard();
      const newDealerCard = dealCard();

      setPlayerCard(newPlayerCard);
      setDealerCard(newDealerCard);

      await playSound("card");
      setTimeout(async () => await playSound("card"), 200);

      setTimeout(
        () => determineResult(newPlayerCard, newDealerCard, betAmount),
        600
      );
    }, 400);
  };

  const determineResult = async (playerCard, dealerCard, betAmount) => {
    let finalWinAmount = 0;
    let resultMessage = "";
    let war = false;
    let isWin = false;

    if (playerCard.numeric > dealerCard.numeric) {
      finalWinAmount = betAmount * 2;
      resultMessage = `VICTORIA`;
      isWin = true;
      await playSound("win");
      triggerWinAnimation();
    } else if (playerCard.numeric < dealerCard.numeric) {
      resultMessage = `DERROTA`;
      await playSound("lose");
      triggerLoseAnimation();
    } else {
      war = true;
      isWin = true;
      finalWinAmount = betAmount * 4;
      resultMessage = `GUERRA`;
      await playSound("win");
      triggerWarAnimation();
    }

    // SOLO GANAS TICKETS, NO MANEKI COINS
    if (isWin) {
      const ticketReward = getTicketRewards(betAmount, war, isWin);
      if (ticketReward > 0) {
        await addTickets(ticketReward, `Ganancia en War ${war ? '(Guerra)' : '(Victoria)'}`);
        setTicketsWon(ticketReward);
      }
    }

    setWinAmount(finalWinAmount);
    setResult(resultMessage);
    setIsWar(war);
    setGameState("result");
    animateResult();
    pulseAnimation();
  };

  const resetGame = async () => {
    setBet(0);
    setPlayerCard(null);
    setDealerCard(null);
    setGameState("betting");
    setResult("");
    setWinAmount(0);
    setIsWar(false);
    setShowWinAnimation(false);
    setShowWarAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    await playSound("click");
  };

  const renderCard = (card, title, isPlayer = true) => {
    const cardAnimation = {
      transform: [
        {
          translateY: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [-30, 0],
          }),
        },
        {
          scale: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
      opacity: cardAnimations,
    };

    const getCardColor = (suit) =>
      suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";

    return (
      <View style={styles.cardArea}>
        <View style={styles.areaHeader}>
          <Text style={styles.areaTitle}>{title}</Text>
          <Text
            style={[
              styles.areaScore,
              {
                backgroundColor: isPlayer
                  ? "rgba(37, 99, 235, 0.3)"
                  : "rgba(220, 38, 38, 0.3)",
              },
            ]}
          >
            {card.numeric}
          </Text>
        </View>
        <Animated.View style={[styles.card, cardAnimation]}>
          <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
            {card.value}
          </Text>
          <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
            {card.suit}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
      <WarAnimation show={showWarAnimation} />
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado */}
        <View style={styles.header}>
          <View style={styles.balances}>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/dinero.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>
                {manekiCoins.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/TICKET.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>{tickets.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}></Text>
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Área de cartas */}
        {playerCard && dealerCard && (
          <View style={styles.cardsComparison}>
            {renderCard(playerCard, "JUGADOR", true)}

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {renderCard(dealerCard, "MANEKI", false)}
          </View>
        )}

        {/* Mensaje de resultado */}
        {(result || ticketsWon > 0) && (
          <Animated.View
            style={[
              styles.messageContainer,
              {
                transform: [
                  {
                    scale: resultAnimations.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                  { scale: pulseAnim },
                ],
                borderColor: isWar
                  ? "#F59E0B"
                  : winAmount > 0
                  ? "#10B981"
                  : "#EF4444",
                backgroundColor: isWar
                  ? "rgba(245, 158, 11, 0.1)"
                  : winAmount > 0
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              },
            ]}
          >
            <Text
              style={[
                styles.message,
                {
                  color: isWar
                    ? "#F59E0B"
                    : winAmount > 0
                    ? "#10B981"
                    : "#EF4444",
                },
              ]}
            >
              {result}
            </Text>
            {ticketsWon > 0 && gameState === "result" && (
              <View style={styles.winContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
                <Text style={styles.winMultiplier}>
                  {isWar ? "Guerra x2 Tickets" : "Victoria"}
                </Text>
              </View>
            )}
            {bet > 0 && !ticketsWon && (
              <Text style={styles.betLost}>
                Pierdes: {bet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        {/* Controles del juego */}
        <View style={styles.controls}>
          {gameState === "betting" && (
            <View style={styles.betContainer}>
              <Text style={styles.betTitle}>SELECCIONE SU APUESTA</Text>

              <View style={styles.betAmounts}>
                {betAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betAmountButton,
                      !canAfford(amount) && styles.disabledButton,
                      bet === amount && styles.selectedBet,
                    ]}
                    onPress={async () => {
                      if (canAfford(amount)) {
                        setBet(amount);
                        await playSound("click");
                        pulseAnimation();
                      } else await playSound("error");
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>
                      {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, false, true)} Tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.currentBet}>
                {bet > 0
                  ? `Apuesta: ${bet.toLocaleString()} MC`
                  : "Seleccione un monto"}
              </Text>

              <TouchableOpacity
                style={[styles.startButton, bet === 0 && styles.disabledButton]}
                onPress={() => bet > 0 && startGame(bet)}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={18} color="#FFF" />
                <Text style={styles.startButtonText}>INICIAR JUEGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "result" && (
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reglas del juego */}
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>REGLAS DEL WAR</Text>
          <View style={styles.rulesGrid}>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleIcon, { color: "#10B981" }]}>↑</Text>
              <Text style={styles.ruleText}>Tu carta es mayor</Text>
              <Text style={styles.ruleMultiplier}>Ganas Tickets</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleIcon, { color: "#F59E0B" }]}>=</Text>
              <Text style={styles.ruleText}>Empate (War)</Text>
              <Text style={styles.ruleMultiplier}>Ganas Tickets x2</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleIcon, { color: "#EF4444" }]}>↓</Text>
              <Text style={styles.ruleText}>Tu carta es menor</Text>
              <Text style={styles.ruleMultiplier}>Pierdes apuesta</Text>
            </View>
          </View>
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
    letterSpacing: 1,
  },
  emptySpace: {
    width: 80,
  },
  cardsComparison: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  vsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  vsText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  card: {
    width: 80,
    height: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardSuit: {
    fontSize: 24,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 16,
    padding: 18,
    borderRadius: 12,
    borderWidth: 3,
    minHeight: 80,
    justifyContent: "center",
  },
  message: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
  },
  winContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "bold",
  },
  winMultiplier: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  betLost: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  controls: {
    marginTop: 10,
    marginBottom: 25,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 12,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 90,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 12,
    marginTop: 4,
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  rulesContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  rulesTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  rulesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ruleItem: {
    alignItems: "center",
    flex: 1,
    padding: 8,
  },
  ruleIcon: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  ruleText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  ruleMultiplier: {
    color: "#FFD700",
    fontSize: 11,
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
  // Estilos para animaciones
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -100,
    marginTop: -80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 25,
    borderRadius: 20,
    borderWidth: 4,
    width: 200,
    height: 160,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  warAnimation: {
    borderColor: "#F59E0B",
  },
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  warText: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  loseText: {
    color: "#EF4444",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  winSubtext: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  warSubtext: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  loseSubtext: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
});