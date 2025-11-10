// src/games/specialty/VideoPoker.js
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

// Hook de sonidos unificado
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      console.log("🔊 Cargando sonidos para Video Poker...");

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

// Componente de animación de victoria
const WinAnimation = ({ show, handName, winAmount }) => {
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
      <Ionicons name="trophy" size={80} color="#FFD700" />
      <Text style={styles.winText}>¡{handName}!</Text>
      <Text style={styles.winAmountText}>Premio: {winAmount}x</Text>
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
      <Text style={styles.loseText}>SIN PREMIO</Text>
    </Animated.View>
  );
};

// Función para calcular premios visuales (sin dar tickets reales)
const getVisualRewards = (betAmount, multiplier = 0) => {
  const baseRewards = {
    10: 12,
    25: 30,
    50: 60,
    100: 120,
  };
  
  const baseTickets = baseRewards[betAmount] || Math.floor(betAmount * 1.2);
  return multiplier > 0 ? Math.floor(baseTickets * multiplier * 0.1) : 0;
};

// Evaluación mejorada de manos de Video Poker
const evaluateVideoPokerHand = (hand) => {
  const values = hand.map(card => card.value);
  const suits = hand.map(card => card.suit);
  
  // Convertir valores a numéricos para ordenar
  const valueMap = {
    'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
    '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  
  const numericValues = values.map(v => valueMap[v]).sort((a, b) => a - b);
  const uniqueValues = [...new Set(values)];
  const uniqueSuits = [...new Set(suits)];
  
  // Contar ocurrencias de cada valor
  const valueCounts = values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});

  const counts = Object.values(valueCounts).sort((a, b) => b - a);

  // Escalera Real (A,K,Q,J,10 mismo palo)
  const isRoyal = uniqueSuits.length === 1 && 
                  values.includes('A') && values.includes('K') && 
                  values.includes('Q') && values.includes('J') && values.includes('10');
  if (isRoyal) return { rank: 10, name: 'ESCALERA REAL', multiplier: 250 };

  // Escalera de Color
  const isStraightFlush = uniqueSuits.length === 1 && 
                          (numericValues[4] - numericValues[0] === 4 ||
                           (numericValues[0] === 2 && numericValues[1] === 3 && 
                            numericValues[2] === 4 && numericValues[3] === 5 && numericValues[4] === 14));
  if (isStraightFlush) return { rank: 9, name: 'ESCALERA DE COLOR', multiplier: 50 };

  // Póker (Four of a Kind)
  if (counts[0] === 4) return { rank: 8, name: 'PÓKER', multiplier: 25 };

  // Full House
  if (counts[0] === 3 && counts[1] === 2) return { rank: 7, name: 'FULL HOUSE', multiplier: 9 };

  // Color (Flush)
  if (uniqueSuits.length === 1) return { rank: 6, name: 'COLOR', multiplier: 6 };

  // Escalera (Straight)
  const isStraight = numericValues[4] - numericValues[0] === 4 ||
                    (numericValues[0] === 2 && numericValues[1] === 3 && 
                     numericValues[2] === 4 && numericValues[3] === 5 && numericValues[4] === 14);
  if (isStraight) return { rank: 5, name: 'ESCALERA', multiplier: 4 };

  // Trío (Three of a Kind)
  if (counts[0] === 3) return { rank: 4, name: 'TRÍO', multiplier: 3 };

  // Doble Pareja
  if (counts[0] === 2 && counts[1] === 2) return { rank: 3, name: 'DOBLE PAREJA', multiplier: 2 };

  // Pareja de Jotas o mejor
  if (counts[0] === 2) {
    const pairValue = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
    if (['J', 'Q', 'K', 'A'].includes(pairValue)) {
      return { rank: 2, name: 'PAREJA DE JOTAS O MEJOR', multiplier: 1 };
    }
  }

  return { rank: 1, name: 'SIN PREMIO', multiplier: 0 };
};

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

export default function VideoPoker({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const playSound = useGameSounds();

  const [bet, setBet] = useState(0);
  const [cards, setCards] = useState([]);
  const [heldCards, setHeldCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [winningHand, setWinningHand] = useState("");
  const [winMultiplier, setWinMultiplier] = useState(0);

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

  const triggerWinAnimation = (handName, multiplier) => {
    setWinningHand(handName);
    setWinMultiplier(multiplier);
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 3000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 3000);
  };

  const dealCards = async (betAmount) => {
    if (!canAfford(betAmount)) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setBet(betAmount);
    await subtractCoins(betAmount, `Apuesta en Video Poker`);
    await playSound("coin");
    pulseAnimation();

    animateCards();

    setTimeout(async () => {
      const newCards = [];
      for (let i = 0; i < 5; i++) {
        const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        newCards.push({ value, suit, held: false });
        if (i < 4) await playSound("card");
      }
      
      setCards(newCards);
      setHeldCards([]);
      setGameState("holding");
      setResult("");
      setTicketsWon(0);

      await playSound("card");
    }, 400);
  };

  const toggleHold = async (index) => {
    if (gameState !== "holding") return;
    
    await playSound("click");
    const newHeldCards = [...heldCards];
    if (newHeldCards.includes(index)) {
      const idx = newHeldCards.indexOf(index);
      newHeldCards.splice(idx, 1);
    } else {
      newHeldCards.push(index);
    }
    setHeldCards(newHeldCards);
  };

  const drawCards = async () => {
    await playSound("click");
    pulseAnimation();

    const newCards = [...cards];
    
    for (let i = 0; i < 5; i++) {
      if (!heldCards.includes(i)) {
        const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        newCards[i] = { value, suit, held: false };
        await playSound("card");
      }
    }
    
    setCards(newCards);
    evaluateHand(newCards);
    setGameState("result");
  };

  const evaluateHand = async (hand) => {
    const evaluation = evaluateVideoPokerHand(hand);
    
    // Calcular premios visuales solamente (NO se otorgan monedas ni tickets reales)
    const visualWinAmount = bet * evaluation.multiplier;
    const visualTicketReward = getVisualRewards(bet, evaluation.multiplier);

    if (evaluation.multiplier > 0) {
      // SOLO mostrar animación y mensaje de victoria - NO dar monedas ni tickets
      setResult(`${evaluation.name}! Premio: ${visualWinAmount} MC (Visual)`);
      setTicketsWon(visualTicketReward);
      await playSound("win");
      triggerWinAnimation(evaluation.name, evaluation.multiplier);
    } else {
      // SI PIERDE - NO dar nada
      setResult("Sin premio. Mejor suerte la próxima");
      setTicketsWon(0);
      await playSound("lose");
      triggerLoseAnimation();
    }

    setGameState("result");
    animateResult();
  };

  const resetGame = async () => {
    setBet(0);
    setGameState("betting");
    setResult("");
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setWinningHand("");
    setWinMultiplier(0);
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

    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <TouchableOpacity
        key={index}
        style={[styles.cardContainer]}
        onPress={() => toggleHold(index)}
        disabled={gameState !== "holding"}
      >
        <Animated.View style={[styles.card, cardAnimation, heldCards.includes(index) && styles.heldCard]}>
          <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
            {card.value}
          </Text>
          <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
            {card.suit}
          </Text>
          <View style={styles.cardCorner}>
            <Text style={[styles.cardCornerValue, { color: getCardColor(card.suit) }]}>
              {card.value}
            </Text>
            <Text style={[styles.cardCornerSuit, { color: getCardColor(card.suit) }]}>
              {card.suit}
            </Text>
          </View>
        </Animated.View>
        {heldCards.includes(index) && (
          <View style={styles.holdIndicator}>
            <Text style={styles.holdText}>MANTENIDA</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animaciones */}
      <WinAnimation show={showWinAnimation} handName={winningHand} winAmount={winMultiplier} />
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado */}
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

          {/* Espacio vacío para balancear */}
          <View style={styles.emptySpace} />
        </View>

        {/* Cartas */}
        <View style={styles.cardsArea}>
          <View style={styles.cardsRow}>
            {cards.map((card, index) => renderCard(card, index))}
          </View>
          {gameState === "holding" && (
            <Text style={styles.holdInstruction}>
              SELECCIONA LAS CARTAS QUE QUIERES MANTENER
            </Text>
          )}
        </View>

        {/* Mensaje y resultado */}
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
          <Text style={styles.message}>
            {result || (gameState === "betting" ? "SELECCIONE SU APUESTA" : 
                      gameState === "holding" ? "MANTENGA SUS CARTAS" : "")}
          </Text>
          {ticketsWon > 0 && gameState === "result" && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets (Visual)</Text>
            </View>
          )}
        </Animated.View>

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
                      } else {
                        await playSound("error");
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>
                      {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.ticketRewardText}>
                      Premio visual solamente
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
                onPress={() => bet > 0 && dealCards(bet)}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={18} color="#FFF" />
                <Text style={styles.startButtonText}>REPARTIR CARTAS</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "holding" && (
            <View style={styles.holdButtons}>
              <TouchableOpacity style={styles.drawButton} onPress={drawCards}>
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.drawButtonText}>DIBUJAR CARTAS</Text>
              </TouchableOpacity>
              <Text style={styles.heldCount}>
                {heldCards.length}/5 cartas mantenidas
              </Text>
            </View>
          )}

          {gameState === "result" && (
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

        {/* Tabla de pagos */}
        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>TABLA DE PREMIOS (VISUAL)</Text>
          <View style={styles.payoutGrid}>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA REAL</Text>
              <Text style={styles.payoutMultiplier}>250x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA DE COLOR</Text>
              <Text style={styles.payoutMultiplier}>50x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>PÓKER</Text>
              <Text style={styles.payoutMultiplier}>25x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>FULL HOUSE</Text>
              <Text style={styles.payoutMultiplier}>9x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>COLOR</Text>
              <Text style={styles.payoutMultiplier}>6x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA</Text>
              <Text style={styles.payoutMultiplier}>4x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>TRÍO</Text>
              <Text style={styles.payoutMultiplier}>3x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>DOBLE PAREJA</Text>
              <Text style={styles.payoutMultiplier}>2x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>PAREJA J+</Text>
              <Text style={styles.payoutMultiplier}>1x</Text>
            </View>
          </View>
          <Text style={styles.disclaimerText}>
            * Los premios son visuales solamente. No se otorgan monedas ni tickets reales.
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
  cardsArea: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardContainer: {
    alignItems: "center",
  },
  card: {
    width: 55,
    height: 77,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
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
  heldCard: {
    borderWidth: 3,
    borderColor: "#FFD700",
    backgroundColor: "#FFF8E1",
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardSuit: {
    fontSize: 16,
  },
  cardCorner: {
    position: "absolute",
    top: 3,
    left: 3,
    alignItems: "center",
  },
  cardCornerValue: {
    fontSize: 7,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 5,
  },
  holdIndicator: {
    marginTop: 5,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  holdText: {
    color: "#FFD700",
    fontSize: 8,
    fontWeight: "bold",
  },
  holdInstruction: {
    color: "#FFD700",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
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
    minWidth: 90,
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
    color: "#888",
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
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
  holdButtons: {
    alignItems: "center",
    gap: 10,
  },
  drawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 8,
  },
  drawButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  heldCount: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
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
    marginBottom: 12,
    textAlign: "center",
  },
  payoutGrid: {
    gap: 5,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  payoutHand: {
    color: "#FFF",
    fontSize: 12,
    flex: 2,
  },
  payoutMultiplier: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  disclaimerText: {
    color: "#888",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
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
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  winAmountText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  loseText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});