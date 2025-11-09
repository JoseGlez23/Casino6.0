// src/games/cards/Blackjack.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
  Vibration,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Hook mejorado de sonidos
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      console.log("🔊 Cargando sonidos...");

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
        if (sound) {
          sound.unloadAsync();
        }
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
      <Ionicons name="sad-outline" size={80} color="#EF4444" />
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

      // Animación de pulso continua
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
      <Ionicons name="trophy" size={80} color="#FFD700" />
      <Text style={styles.winText}>¡GANASTE!</Text>
    </Animated.View>
  );
};

// Tabla de premios de tickets
const getTicketRewards = (betAmount, isBlackjack = false) => {
  const rewards = {
    100: isBlackjack ? 180 : 120,
    250: isBlackjack ? 450 : 300,
    500: isBlackjack ? 900 : 600,
    1000: isBlackjack ? 1800 : 1200,
  };
  return rewards[betAmount] || 0;
};

export default function Blackjack({ navigation }) {
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
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("betting");
  const [message, setMessage] = useState("Realice su apuesta");
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);

  const cardAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
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

  const cardValues = {
    A: 11,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 10,
    Q: 10,
    K: 10,
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const calculateScore = (cards) => {
    let score = cards.reduce(
      (total, card) => total + cardValues[card.value],
      0
    );
    let aces = cards.filter((card) => card.value === "A").length;

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
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
      duration: 600,
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
    setTimeout(() => setShowWinAnimation(false), 3000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 3000);
  };

  const startGame = async (betAmount) => {
    if (!canAfford(betAmount)) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setBet(betAmount);
    subtractCoins(betAmount, `Apuesta en Blackjack`);
    await playSound("coin");
    pulseAnimation();

    animateCards();

    setTimeout(async () => {
      const playerCard1 = dealCard();
      const playerCard2 = dealCard();
      const dealerCard1 = dealCard();
      const dealerCard2 = dealCard();

      const newPlayerCards = [playerCard1, playerCard2];
      const newDealerCards = [dealerCard1, dealerCard2];

      setPlayerCards(newPlayerCards);
      setDealerCards(newDealerCards);

      const playerTotal = calculateScore(newPlayerCards);
      const dealerTotal = calculateScore([dealerCard1]);

      setPlayerScore(playerTotal);
      setDealerScore(dealerTotal);
      setGameStatus("playing");
      setMessage("Su turno: Pedir carta o Plantarse");

      await playSound("card");
      setTimeout(async () => await playSound("card"), 200);

      if (playerTotal === 21) {
        setTimeout(() => checkBlackjack(), 800);
      }
    }, 400);
  };

  const checkBlackjack = async () => {
    if (playerScore === 21 && playerCards.length === 2) {
      const winAmount = Math.floor(bet * 2.5);
      const ticketReward = getTicketRewards(bet, true);

      addCoins(winAmount, `Blackjack Natural - Ganancia`);
      await addTickets(ticketReward, `Blackjack Natural - Tickets`);

      setGameStatus("ended");
      setMessage(
        `¡BLACKJACK! Gana ${winAmount.toLocaleString()} MC + ${ticketReward} Tickets`
      );
      setTicketsWon(ticketReward);
      animateResult();
      await playSound("win");
      pulseAnimation();
      triggerWinAnimation();
    }
  };

  const hit = async () => {
    const newCard = dealCard();
    const newPlayerCards = [...playerCards, newCard];
    const newScore = calculateScore(newPlayerCards);

    setPlayerCards(newPlayerCards);
    setPlayerScore(newScore);

    await playSound("card");
    pulseAnimation();

    if (newScore > 21) {
      setGameStatus("ended");
      setMessage("SE PASÓ - Pierde la apuesta");
      animateResult();
      await playSound("lose");
      triggerLoseAnimation();
    } else if (newScore === 21) {
      stand();
    }
  };

  const stand = async () => {
    setGameStatus("dealer");
    setMessage("Turno de Maneki...");
    await playSound("click");

    setTimeout(() => dealerPlay(), 800);
  };

  const dealerPlay = async () => {
    let currentDealerCards = [...dealerCards];
    let currentDealerScore = calculateScore(currentDealerCards);

    const dealerTurn = async () => {
      if (currentDealerScore < 17) {
        const newCard = dealCard();
        currentDealerCards.push(newCard);
        currentDealerScore = calculateScore(currentDealerCards);

        setDealerCards([...currentDealerCards]);
        setDealerScore(currentDealerScore);

        await playSound("card");

        setTimeout(dealerTurn, 800);
      } else {
        determineWinner(currentDealerScore);
      }
    };

    dealerTurn();
  };

  const determineWinner = async (finalDealerScore) => {
    let resultMessage = "";
    let winAmount = 0;
    let ticketReward = 0;
    let isWin = false;
    let isLose = false;

    if (finalDealerScore > 21) {
      // Jugador gana - Dealer se pasó
      winAmount = bet * 2;
      ticketReward = getTicketRewards(bet, false);
      resultMessage = `MANEKI SE PASÓ `;
      isWin = true;
      await playSound("win");
    } else if (finalDealerScore > playerScore) {
      // Dealer gana
      resultMessage = "MANEKI GANA - Pierde la apuesta";
      winAmount = 0;
      ticketReward = 0;
      isLose = true;
      await playSound("lose");
    } else if (finalDealerScore < playerScore) {
      // Jugador gana
      winAmount = bet * 2;
      ticketReward = getTicketRewards(bet, false);
      resultMessage = `¡FELICIDADES! `;
      isWin = true;
      await playSound("win");
    } else {
      // Empate
      resultMessage = "EMPATE - Recupera su apuesta";
      winAmount = bet;
      ticketReward = 0;
      await playSound("click");
    }

    // Procesar ganancias
    if (winAmount > 0) {
      if (winAmount > bet) {
        // Solo agregar ganancia neta
        const netWin = winAmount - bet;
        addCoins(netWin, `Ganancia en Blackjack`);
      }

      if (ticketReward > 0) {
        await addTickets(ticketReward, `Ganancia en Blackjack - Tickets`);
        setTicketsWon(ticketReward);
      }
    }

    setGameStatus("ended");
    setMessage(resultMessage);
    animateResult();
    pulseAnimation();

    // Activar animaciones
    if (isWin) {
      triggerWinAnimation();
    } else if (isLose) {
      triggerLoseAnimation();
    }
  };

  const resetGame = async () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerScore(0);
    setDealerScore(0);
    setGameStatus("betting");
    setMessage("Realice su apuesta");
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    await playSound("click");
  };

  const renderCard = (card, index, hide = false) => {
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

    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <Animated.View key={index} style={[styles.card, cardAnimation]}>
        {hide ? (
          <View style={styles.hiddenCard}>
            <View style={styles.cardPattern} />
          </View>
        ) : (
          <>
            <Text
              style={[styles.cardValue, { color: getCardColor(card.suit) }]}
            >
              {card.value}
            </Text>
            <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
              {card.suit}
            </Text>
            <View style={styles.cardCorner}>
              <Text
                style={[
                  styles.cardCornerValue,
                  { color: getCardColor(card.suit) },
                ]}
              >
                {card.value}
              </Text>
              <Text
                style={[
                  styles.cardCornerSuit,
                  { color: getCardColor(card.suit) },
                ]}
              >
                {card.suit}
              </Text>
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  const betAmounts = [100, 250, 500, 1000];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animación de victoria */}
      <WinAnimation show={showWinAnimation} />

      {/* Animación de pérdida */}
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con saldo y tickets al lado, título centrado */}
        <View style={styles.header}>
          {/* Saldo y Tickets al lado izquierdo */}
          <View style={styles.balancesContainer}>
            <View style={styles.balanceRow}>
              {/* Saldo */}
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

              {/* Tickets */}
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

          {/* Título centrado */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}></Text>
          </View>

          {/* Espacio vacío para balancear el diseño */}
          <View style={styles.emptySpace} />
        </View>

        {/* Área de Maneki - Compacta */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>MANEKI</Text>
            <Text style={styles.areaScore}>
              {gameStatus !== "playing" ? dealerScore : "?"}
            </Text>
          </View>
          <View style={styles.cardsContainer}>
            {dealerCards.map((card, index) =>
              renderCard(card, index, index === 1 && gameStatus === "playing")
            )}
          </View>
        </View>

        {/* Mensaje compacto */}
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
                {
                  scale: pulseAnim,
                },
              ],
            },
          ]}
        >
          <Text style={styles.message}>{message}</Text>
          {ticketsWon > 0 && gameStatus === "ended" && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
            </View>
          )}
        </Animated.View>

        {/* Área del Jugador - Compacta */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>JUGADOR</Text>
            <Text style={styles.areaScore}>{playerScore}</Text>
          </View>
          <View style={styles.cardsContainer}>
            {playerCards.map((card, index) => renderCard(card, index))}
          </View>
        </View>

        {/* Controles compactos */}
        <View style={styles.controls}>
          {gameStatus === "betting" && (
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
                      } else {
                        await playSound("error");
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>
                      {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.ticketRewardText}>MANEKI COINS</Text>
                    <Text style={styles.blackjackRewardText}></Text>
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

          {gameStatus === "playing" && (
            <View style={styles.gameButtons}>
              <TouchableOpacity style={styles.hitButton} onPress={hit}>
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>PEDIR CARTA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.standButton} onPress={stand}>
                <Ionicons name="hand-left" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>PLANTARSE</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameStatus === "ended" && (
            <View style={styles.endButtons}>
              <TouchableOpacity
                style={styles.playAgainButton}
                onPress={resetGame}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingHorizontal: 5,
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
  emptySpace: {
    width: 80,
  },
  area: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 110,
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
  },
  card: {
    width: 55,
    height: 77,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    margin: 4,
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardSuit: {
    fontSize: 18,
  },
  cardCorner: {
    position: "absolute",
    top: 4,
    left: 4,
    alignItems: "center",
  },
  cardCornerValue: {
    fontSize: 8,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 6,
  },
  hiddenCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#8B0000",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cardPattern: {
    width: "70%",
    height: "70%",
    backgroundColor: "#A52A2A",
    borderRadius: 4,
    opacity: 0.6,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 10,
    padding: 12,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
    minHeight: 60,
    justifyContent: "center",
  },
  message: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
  },
  ticketsWonContainer: {
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
    fontSize: 12,
    fontWeight: "bold",
  },
  controls: {
    marginTop: 5,
    marginBottom: 15,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 8,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 100,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 10,
    marginTop: 2,
  },
  blackjackRewardText: {
    color: "#FFD700",
    fontSize: 9,
    marginTop: 1,
    fontStyle: "italic",
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  gameButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  hitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  standButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#B91C1C",
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  endButtons: {
    alignItems: "center",
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  bottomSpacer: {
    height: 10,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  // Estilos para animaciones - CORREGIDOS PARA CENTRAR
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -100, // Mitad del ancho aproximado del contenedor
    marginTop: -80, // Mitad del alto aproximado del contenedor
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
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});
