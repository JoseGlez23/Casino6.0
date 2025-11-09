// src/games/cards/Poker.js
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

// Hook de sonidos para Poker
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
      <Ionicons name="sad-outline" size={60} color="#EF4444" />
      <Text style={styles.loseText}>¡PERDISTE!</Text>
    </Animated.View>
  );
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
      <Ionicons name="trophy" size={60} color="#FFD700" />
      <Text style={styles.winText}>¡GANASTE!</Text>
    </Animated.View>
  );
};

// Tabla de premios de tickets para Poker
const getTicketRewards = (betAmount, handRank) => {
  const baseRewards = {
    50: { 1: 30, 2: 60, 3: 90, 4: 120, 5: 150, 6: 180, 7: 210, 8: 240, 9: 300 },
    100: {
      1: 60,
      2: 120,
      3: 180,
      4: 240,
      5: 300,
      6: 360,
      7: 420,
      8: 480,
      9: 600,
    },
    250: {
      1: 150,
      2: 300,
      3: 450,
      4: 600,
      5: 750,
      6: 900,
      7: 1050,
      8: 1200,
      9: 1500,
    },
    500: {
      1: 300,
      2: 600,
      3: 900,
      4: 1200,
      5: 1500,
      6: 1800,
      7: 2100,
      8: 2400,
      9: 3000,
    },
  };
  return baseRewards[betAmount]?.[handRank] || 0;
};

export default function Poker({ navigation }) {
  const {
    manekiCoins,
    tickets,
    addCoins,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const playSound = useGameSounds();

  const [bet, setBet] = useState(100);
  const [gameState, setGameState] = useState("betting");
  const [playerCards, setPlayerCards] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [result, setResult] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [round, setRound] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
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
    A: 14,
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
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const dealCard = () => {
    const values = Object.keys(cardValues);
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit };
  };

  const animateCards = () => {
    cardAnimations.setValue(0);
    Animated.timing(cardAnimations, {
      toValue: 1,
      duration: 400,
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
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerWinAnimation = () => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2000);
  };

  const evaluateHand = (cards) => {
    const values = cards.map((card) => cardValues[card.value]);
    const suits = cards.map((card) => card.suit);

    values.sort((a, b) => a - b);

    const valueCounts = {};
    values.forEach((value) => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });

    const counts = Object.values(valueCounts);
    const uniqueValues = Object.keys(valueCounts).map(Number);

    let isStraight = false;
    if (uniqueValues.length >= 5) {
      for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
          isStraight = true;
          break;
        }
      }
      // Escalera A-5
      if (
        uniqueValues.includes(14) &&
        uniqueValues.includes(2) &&
        uniqueValues.includes(3) &&
        uniqueValues.includes(4) &&
        uniqueValues.includes(5)
      ) {
        isStraight = true;
      }
    }

    const isFlush = suits.every((suit) => suit === suits[0]);

    if (isStraight && isFlush && values.includes(14) && values.includes(13))
      return { rank: 9, name: "Escalera Real" };
    if (isStraight && isFlush) return { rank: 8, name: "Escalera de Color" };
    if (counts.includes(4)) return { rank: 7, name: "Póquer" };
    if (counts.includes(3) && counts.includes(2))
      return { rank: 6, name: "Full House" };
    if (isFlush) return { rank: 5, name: "Color" };
    if (isStraight) return { rank: 4, name: "Escalera" };
    if (counts.includes(3)) return { rank: 3, name: "Trío" };
    if (counts.filter((count) => count === 2).length === 2)
      return { rank: 2, name: "Doble Pareja" };
    if (counts.includes(2)) return { rank: 1, name: "Pareja" };
    return { rank: 0, name: "Carta Alta" };
  };

  const startGame = async () => {
    if (!canAfford(bet)) {
      await playSound("error");
      Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins");
      return;
    }

    subtractCoins(bet, `Apuesta en Poker Texas Hold'em`);
    await playSound("coin");
    pulseAnimation();
    animateCards();

    setGameState("dealing");
    setResult("");
    setRound(1);
    setTicketsWon(0);

    setTimeout(async () => {
      const newPlayerCards = [dealCard(), dealCard()];
      const newDealerCards = [dealCard(), dealCard()];
      const newCommunityCards = [dealCard(), dealCard(), dealCard()];

      setPlayerCards(newPlayerCards);
      setDealerCards(newDealerCards);
      setCommunityCards(newCommunityCards);

      await playSound("card");
      setTimeout(async () => await playSound("card"), 100);
      setTimeout(async () => await playSound("card"), 200);
      setTimeout(async () => await playSound("card"), 300);
      setTimeout(async () => await playSound("card"), 400);
      setTimeout(async () => await playSound("card"), 500);

      setGameState("flop");
    }, 300);
  };

  const continueGame = async () => {
    if (round === 1) {
      await playSound("click");
      const newCard = dealCard();
      setCommunityCards((prev) => [...prev, newCard]);
      await playSound("card");
      setRound(2);
      setGameState("turn");
    } else if (round === 2) {
      await playSound("click");
      const newCard = dealCard();
      setCommunityCards((prev) => [...prev, newCard]);
      await playSound("card");
      setRound(3);
      setGameState("river");
      setTimeout(() => determineWinner(), 800);
    }
  };

  const determineWinner = async () => {
    const allPlayerCards = [...playerCards, ...communityCards];
    const allDealerCards = [...dealerCards, ...communityCards];

    const playerHand = evaluateHand(allPlayerCards);
    const dealerHand = evaluateHand(allDealerCards);

    let winner = "";
    let ticketReward = 0;

    if (playerHand.rank > dealerHand.rank) {
      winner = "player";
      ticketReward = getTicketRewards(bet, playerHand.rank);
      setResult(`¡GANASTE! - ${playerHand.name}`);
      await playSound("win");
      triggerWinAnimation();
    } else if (dealerHand.rank > playerHand.rank) {
      winner = "dealer";
      setResult(` MANEKI gana - ${dealerHand.name}`);
      await playSound("lose");
      triggerLoseAnimation();
    } else {
      winner = "tie";
      ticketReward = getTicketRewards(bet, playerHand.rank) / 2; // Mitad de tickets en empate
      setResult(` EMPATE - ${playerHand.name}`);
      await playSound("click");
    }

    // SOLO GANAS TICKETS, NO MANEKI COINS
    if (ticketReward > 0) {
      await addTickets(ticketReward, `Ganancia en Poker - ${playerHand.name}`);
      setTicketsWon(ticketReward);
    }

    setWinAmount(0); // Ya no hay ganancia de Maneki Coins
    setGameState("result");
    animateResult();
    pulseAnimation();
  };

  const resetGame = async () => {
    setBet(100);
    setGameState("betting");
    setPlayerCards([]);
    setCommunityCards([]);
    setDealerCards([]);
    setResult("");
    setWinAmount(0);
    setRound(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    await playSound("click");
  };

  const renderCard = (card, index, isHidden = false) => {
    const cardAnimation = {
      transform: [
        {
          translateY: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0],
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

    if (isHidden) {
      return (
        <Animated.View key={index} style={[styles.card, cardAnimation]}>
          <View style={styles.hiddenCard}>
            <View style={styles.cardPattern} />
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View key={index} style={[styles.card, cardAnimation]}>
        <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
          {card.value}
        </Text>
        <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
          {card.suit}
        </Text>
      </Animated.View>
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header ultra compacto */}
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
            <Text style={styles.title}>POKER</Text>
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Área de Maneki */}
        {gameState !== "betting" && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>MANEKI</Text>
              <Text style={styles.areaScore}>
                {gameState === "result" ? "REVELADO" : "OCULTO"}
              </Text>
            </View>
            <View style={styles.cardsContainer}>
              {dealerCards.map((card, index) =>
                renderCard(card, index, gameState !== "result")
              )}
            </View>
          </View>
        )}

        {/* Cartas Comunitarias */}
        {communityCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>CARTAS COMUNITARIAS</Text>
              <Text style={styles.areaScore}>
                {round === 1 ? "FLOP" : round === 2 ? "TURN" : "RIVER"}
              </Text>
            </View>
            <View style={styles.cardsContainer}>
              {communityCards.map((card, index) => renderCard(card, index))}
            </View>
          </View>
        )}

        {/* Mensaje del juego */}
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
              },
            ]}
          >
            <Text
              style={[
                styles.message,
                ticketsWon > 0 ? styles.winMessage : styles.loseMessage,
              ]}
            >
              {result}
            </Text>
            {ticketsWon > 0 && gameState === "result" && (
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
            )}
            {bet > 0 && !ticketsWon && (
              <Text style={styles.betLost}>
                Pierdes: {bet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        {/* Cartas del Jugador */}
        {playerCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>TUS CARTAS</Text>
              <Text style={styles.areaScore}>JUGADOR</Text>
            </View>
            <View style={styles.cardsContainer}>
              {playerCards.map((card, index) => renderCard(card, index))}
            </View>
          </View>
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
                      +{getTicketRewards(amount, 1)} Tickets
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
                onPress={startGame}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={16} color="#FFF" />
                <Text style={styles.startButtonText}>INICIAR JUEGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {(gameState === "flop" || gameState === "turn") && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={continueGame}
            >
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
              <Text style={styles.continueButtonText}>
                {round === 1 ? "REVELAR TURN" : "REVELAR RIVER"}
              </Text>
            </TouchableOpacity>
          )}

          {gameState === "result" && (
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balances: {
    flexDirection: "row",
    gap: 8,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 4,
  },
  balanceIcon: {
    width: 12,
    height: 12,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 11,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 70,
  },
  area: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  card: {
    width: 45,
    height: 65,
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    margin: 3,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardSuit: {
    fontSize: 16,
  },
  hiddenCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#8B0000",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardPattern: {
    width: "70%",
    height: "70%",
    backgroundColor: "#A52A2A",
    borderRadius: 3,
    opacity: 0.6,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 8,
    padding: 10,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 50,
    justifyContent: "center",
  },
  message: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  winMessage: {
    color: "#10B981",
    borderColor: "#10B981",
  },
  loseMessage: {
    color: "#EF4444",
    borderColor: "#EF4444",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 3,
  },
  betLost: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 3,
    opacity: 0.8,
  },
  controls: {
    marginTop: 5,
    marginBottom: 10,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 6,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 70,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 9,
    marginTop: 2,
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 6,
  },
  continueButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 20,
    borderRadius: 15,
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
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
});
