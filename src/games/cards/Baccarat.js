// src/games/cards/Baccarat.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Vibration,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Hook de sonidos para Baccarat
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
          console.log(`❌ Error cargando sonido ${key}:`, error);
        }
      }

      setSounds(soundObjects);
    } catch (error) {
      console.log("❌ Error inicializando sistema de sonido:", error);
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
      <Ionicons name="sad-outline" size={70} color="#EF4444" />
      <Text style={styles.loseText}>PERDISTE</Text>
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
      <Ionicons name="trophy" size={70} color="#FFD700" />
      <Text style={styles.winText}>GANASTE</Text>
    </Animated.View>
  );
};

// Tabla de premios de tickets para Baccarat
const getTicketRewards = (betAmount, betType, isWin = false) => {
  if (!isWin) return 0;

  const rewards = {
    100: { player: 120, banker: 115, tie: 150 },
    250: { player: 300, banker: 285, tie: 375 },
    500: { player: 600, banker: 570, tie: 750 },
    1000: { player: 1200, banker: 1140, tie: 1500 },
  };
  return rewards[betAmount]?.[betType] || 0;
};

export default function Baccarat({ navigation }) {
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
  const [betType, setBetType] = useState("");
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
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
    A: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 0,
    J: 0,
    Q: 0,
    K: 0,
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const calculateScore = (cards) => {
    return (
      cards.reduce((total, card) => total + cardValues[card.value], 0) % 10
    );
  };

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

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2500);
  };

  const placeBet = async (amount, type) => {
    if (!canAfford(amount)) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setBet(amount);
    setBetType(type);
    subtractCoins(amount, `Apuesta en Baccarat - ${type}`);
    setGameState("dealing");
    setResult("");
    setTicketsWon(0);

    await playSound("coin");
    pulseAnimation();
    animateCards();

    setTimeout(async () => {
      const playerCard1 = dealCard();
      const playerCard2 = dealCard();
      const bankerCard1 = dealCard();
      const bankerCard2 = dealCard();

      const newPlayerCards = [playerCard1, playerCard2];
      const newBankerCards = [bankerCard1, bankerCard2];

      setPlayerCards(newPlayerCards);
      setBankerCards(newBankerCards);

      await playSound("card");
      setTimeout(async () => await playSound("card"), 200);
      setTimeout(async () => await playSound("card"), 400);
      setTimeout(async () => await playSound("card"), 600);

      const initialPlayerScore = calculateScore(newPlayerCards);
      const initialBankerScore = calculateScore(newBankerCards);

      setPlayerScore(initialPlayerScore);
      setBankerScore(initialBankerScore);

      let playerThirdCard = null;
      let bankerThirdCard = null;

      if (initialPlayerScore <= 5) {
        setTimeout(async () => {
          playerThirdCard = dealCard();
          newPlayerCards.push(playerThirdCard);
          setPlayerCards([...newPlayerCards]);
          setPlayerScore(calculateScore(newPlayerCards));
          await playSound("card");
        }, 800);
      }

      setTimeout(async () => {
        const currentPlayerScore = calculateScore(newPlayerCards);

        if (initialBankerScore <= 2) {
          bankerThirdCard = dealCard();
          newBankerCards.push(bankerThirdCard);
        } else if (
          initialBankerScore === 3 &&
          (!playerThirdCard || cardValues[playerThirdCard?.value] !== 8)
        ) {
          bankerThirdCard = dealCard();
          newBankerCards.push(bankerThirdCard);
        } else if (
          initialBankerScore === 4 &&
          playerThirdCard &&
          [2, 3, 4, 5, 6, 7].includes(cardValues[playerThirdCard.value])
        ) {
          bankerThirdCard = dealCard();
          newBankerCards.push(bankerThirdCard);
        } else if (
          initialBankerScore === 5 &&
          playerThirdCard &&
          [4, 5, 6, 7].includes(cardValues[playerThirdCard.value])
        ) {
          bankerThirdCard = dealCard();
          newBankerCards.push(bankerThirdCard);
        } else if (
          initialBankerScore === 6 &&
          playerThirdCard &&
          [6, 7].includes(cardValues[playerThirdCard.value])
        ) {
          bankerThirdCard = dealCard();
          newBankerCards.push(bankerThirdCard);
        }

        if (bankerThirdCard) {
          await playSound("card");
        }

        setBankerCards([...newBankerCards]);
        setBankerScore(calculateScore(newBankerCards));

        setTimeout(async () => {
          const finalPlayerScore = calculateScore(newPlayerCards);
          const finalBankerScore = calculateScore(newBankerCards);

          let winner = "";
          if (finalPlayerScore > finalBankerScore) winner = "player";
          else if (finalBankerScore > finalPlayerScore) winner = "banker";
          else winner = "tie";

          let isWin = false;
          if (winner === type) {
            isWin = true;
          }

          // SOLO GANAS TICKETS, NO MANEKI COINS
          if (isWin) {
            const ticketReward = getTicketRewards(amount, type, true);
            if (ticketReward > 0) {
              await addTickets(ticketReward, `Ganancia en Baccarat - ${type}`);
              setTicketsWon(ticketReward);
            }

            setResult(`${winner.toUpperCase()} GANA - ¡GANASTE TICKETS!`);
            await playSound("win");
            triggerWinAnimation();
          } else {
            setResult(`${winner.toUpperCase()} GANA - Mejor suerte la próxima`);
            await playSound("lose");
            triggerLoseAnimation();
          }

          setGameState("result");
          animateResult();
          pulseAnimation();
        }, 500);
      }, 1200);
    }, 500);
  };

  const resetGame = async () => {
    setBet(0);
    setBetType("");
    setPlayerCards([]);
    setBankerCards([]);
    setGameState("betting");
    setResult("");
    setWinAmount(0);
    setPlayerScore(0);
    setBankerScore(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    await playSound("click");
  };

  const renderCard = (card, index) => {
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
      <Animated.View key={index} style={[styles.card, cardAnimation]}>
        <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
          {card.value}
        </Text>
        <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
          {card.suit}
        </Text>
        <View style={styles.cardCorner}>
          <Text
            style={[styles.cardCornerValue, { color: getCardColor(card.suit) }]}
          >
            {card.value}
          </Text>
          <Text
            style={[styles.cardCornerSuit, { color: getCardColor(card.suit) }]}
          >
            {card.suit}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const betAmounts = [100, 250, 500, 1000];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
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

        {/* Área de apuestas mejorada */}
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
                    +{getTicketRewards(amount, "player", true)} Tickets
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.currentBet}>
              {bet > 0
                ? `Apuesta seleccionada: ${bet.toLocaleString()} MC`
                : "Seleccione un monto de apuesta"}
            </Text>

            <View style={styles.betOptions}>
              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.playerBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={async () => bet > 0 && placeBet(bet, "player")}
                disabled={bet === 0}
              >
                <Ionicons name="person" size={22} color="#FFF" />
                <Text style={styles.betOptionText}>JUGADOR</Text>
                <Text style={styles.betOdds}>Ganas Tickets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.bankerBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={async () => bet > 0 && placeBet(bet, "banker")}
                disabled={bet === 0}
              >
                <Ionicons name="business" size={22} color="#FFF" />
                <Text style={styles.betOptionText}>MANEKI</Text>
                <Text style={styles.betOdds}>Ganas Tickets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.tieBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={async () => bet > 0 && placeBet(bet, "tie")}
                disabled={bet === 0}
              >
                <Ionicons name="swap-horizontal" size={22} color="#FFF" />
                <Text style={styles.betOptionText}>EMPATE</Text>
                <Text style={styles.betOdds}>Ganas Tickets x2</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Área del juego mejorada */}
        {(gameState === "dealing" || gameState === "result") && (
          <View style={styles.gameArea}>
            <View style={styles.cardArea}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaTitle}>JUGADOR</Text>
                <Text style={styles.areaScore}>{playerScore}</Text>
              </View>
              <View style={styles.cardsContainer}>
                {playerCards.map((card, index) => renderCard(card, index))}
              </View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.cardArea}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaTitle}>MANEKI</Text>
                <Text style={styles.areaScore}>{bankerScore}</Text>
              </View>
              <View style={styles.cardsContainer}>
                {bankerCards.map((card, index) => renderCard(card, index))}
              </View>
            </View>
          </View>
        )}

        {/* Mensaje de resultado mejorado */}
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
              <View style={styles.ticketsWonContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
              </View>
            )}
            {bet > 0 && !ticketsWon && (
              <Text style={styles.betLost}>
                Pierdes: {bet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        {/* Botones de acción mejorados */}
        <View style={styles.controls}>
          {gameState === "result" && (
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
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
  betContainer: {
    alignItems: "center",
    marginBottom: 25,
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
  betOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  betOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 3,
    gap: 8,
  },
  playerBet: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  bankerBet: {
    backgroundColor: "#DC2626",
    borderColor: "#B91C1C",
  },
  tieBet: {
    backgroundColor: "#059669",
    borderColor: "#047857",
  },
  disabledBet: {
    opacity: 0.5,
  },
  betOptionText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  betOdds: {
    color: "#FFF",
    fontSize: 12,
    opacity: 0.9,
  },
  gameArea: {
    marginBottom: 20,
  },
  cardArea: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  vsContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  vsText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  card: {
    width: 60,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSuit: {
    fontSize: 20,
  },
  cardCorner: {
    position: "absolute",
    top: 6,
    left: 6,
    alignItems: "center",
  },
  cardCornerValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 8,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 15,
    padding: 16,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 70,
    justifyContent: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
  },
  winMessage: {
    color: "#10B981",
    borderColor: "#10B981",
  },
  loseMessage: {
    color: "#EF4444",
    borderColor: "#EF4444",
  },
  ticketsWonContainer: {
    marginTop: 8,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
  },
  betLost: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  controls: {
    alignItems: "center",
    marginTop: 10,
  },
  playAgainButton: {
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
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
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
    marginLeft: -100,
    marginTop: -80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 25,
    borderRadius: 20,
    borderWidth: 4,
    width: 200,
    height: 160,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 10,
  },
});