// src/games/specialty/PaiGow.js
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
      console.log("🔊 Cargando sonidos para Pai Gow Poker...");

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
      <Ionicons name="trophy" size={80} color="#FFD700" />
      <Text style={styles.winText}>¡MANO VÁLIDA!</Text>
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
      <Text style={styles.loseText}>MANO NO VÁLIDA</Text>
    </Animated.View>
  );
};

// Función para calcular tickets según apuesta
const getTicketRewards = (betAmount, isWin = false) => {
  const baseRewards = {
    10: 15,
    25: 38,
    50: 75,
    100: 150,
  };
  
  const baseTickets = baseRewards[betAmount] || Math.floor(betAmount * 1.5);
  return isWin ? baseTickets : Math.floor(baseTickets * 0.3);
};

// Evaluación de manos para Pai Gow
const evaluatePaiGowHand = (hand5, hand2) => {
  // Evaluar mano de 5 cartas
  const values5 = hand5.map(card => card.numeric);
  const suits5 = hand5.map(card => card.suit);
  
  // Verificar si la mano de 5 es válida (debe tener al menos par)
  const valueCounts5 = getValueCounts(values5);
  const hasPair5 = Math.max(...Object.values(valueCounts5)) >= 2;
  
  // Evaluar mano de 2 cartas
  const values2 = hand2.map(card => card.numeric);
  const valueCounts2 = getValueCounts(values2);
  const hasPair2 = Math.max(...Object.values(valueCounts2)) >= 2;
  
  return {
    hand5Valid: hasPair5,
    hand2Valid: hasPair2,
    hand5Rank: hasPair5 ? getHandRank(hand5) : 0,
    hand2Rank: hasPair2 ? getHandRank(hand2) : 0,
    isValid: hasPair5 && hasPair2
  };
};

const getValueCounts = (values) => {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
};

const getHandRank = (hand) => {
  const values = hand.map(card => card.numeric);
  const suits = hand.map(card => card.suit);
  const valueCounts = getValueCounts(values);
  
  if (hand.length === 5) {
    // Evaluación para mano de 5 cartas
    if (Math.max(...Object.values(valueCounts)) === 4) return 8; // Póker
    if (Object.values(valueCounts).includes(3) && Object.values(valueCounts).includes(2)) return 7; // Full
    if (new Set(suits).size === 1) return 6; // Color
    if (checkStraight(values)) return 5; // Escalera
    if (Object.values(valueCounts).includes(3)) return 4; // Trío
    if (Object.values(valueCounts).filter(count => count === 2).length === 2) return 3; // Doble pareja
    if (Object.values(valueCounts).includes(2)) return 2; // Pareja
    return 1; // Carta alta
  } else {
    // Evaluación para mano de 2 cartas
    if (Object.values(valueCounts).includes(2)) return 2; // Pareja
    return 1; // Carta alta
  }
};

const checkStraight = (values) => {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < 5) return false;
  
  for (let i = 0; i <= sorted.length - 5; i++) {
    if (sorted[i + 4] - sorted[i] === 4) return true;
  }
  
  if (sorted.includes(14) && sorted.includes(2) && sorted.includes(3) && 
      sorted.includes(4) && sorted.includes(5)) return true;
  
  return false;
};

// Algoritmo de organización automática mejorado
const autoArrangeCards = (cards) => {
  const sortedCards = [...cards].sort((a, b) => b.numeric - a.numeric);
  
  // Intentar encontrar la mejor combinación
  let bestHand5 = sortedCards.slice(0, 5);
  let bestHand2 = sortedCards.slice(5, 7);
  let bestEvaluation = evaluatePaiGowHand(bestHand5, bestHand2);
  
  // Si no es válida, intentar otras combinaciones
  if (!bestEvaluation.isValid) {
    // Estrategia simple: mover cartas altas a la mano de 2 si es necesario
    for (let i = 0; i < 3; i++) {
      const alternativeHand5 = [...sortedCards.slice(0, 4), sortedCards[6]];
      const alternativeHand2 = [sortedCards[4], sortedCards[5]];
      const altEvaluation = evaluatePaiGowHand(alternativeHand5, alternativeHand2);
      
      if (altEvaluation.isValid) {
        return { hand5: alternativeHand5, hand2: alternativeHand2 };
      }
    }
  }
  
  return { hand5: bestHand5, hand2: bestHand2 };
};

export default function PaiGow({ navigation }) {
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
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [arrangedHands, setArrangedHands] = useState({ hand5: [], hand2: [] });

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
    'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
    '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };

  const suits = ['♠', '♥', '♦', '♣'];

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
    await subtractCoins(betAmount, `Apuesta en Pai Gow Poker`);
    await playSound("coin");
    pulseAnimation();

    animateCards();

    setTimeout(async () => {
      // Repartir 7 cartas
      const newCards = [];
      for (let i = 0; i < 7; i++) {
        newCards.push(dealCard());
        if (i < 6) await playSound("card");
      }
      
      setCards(newCards);
      setGameState("arranging");
      setResult("");
      setTicketsWon(0);
      setArrangedHands({ hand5: [], hand2: [] });

      await playSound("card");
    }, 400);
  };

  const handleAutoArrange = async () => {
    await playSound("click");
    pulseAnimation();
    
    const arrangement = autoArrangeCards(cards);
    setArrangedHands(arrangement);
    
    setTimeout(() => {
      evaluateHands(arrangement.hand5, arrangement.hand2);
    }, 1000);
  };

  const evaluateHands = async (hand5, hand2) => {
    const evaluation = evaluatePaiGowHand(hand5, hand2);
    
    if (evaluation.isValid) {
      const winAmount = bet;
      const ticketReward = getTicketRewards(bet, true);
      
      await addCoins(winAmount, `Ganancia en Pai Gow Poker - Mano válida`);
      await addTickets(ticketReward, `Ganancia - Pai Gow Poker`);
      
      setResult(`¡Maneki acepta tu mano! +${winAmount} MC + ${ticketReward} Tickets`);
      setTicketsWon(ticketReward);
      await playSound("win");
      triggerWinAnimation();
    } else {
      setResult("Maneki rechaza tu mano. No cumple las reglas");
      setTicketsWon(getTicketRewards(bet, false));
      await addTickets(getTicketRewards(bet, false), "Tickets por mano inválida");
      await playSound("lose");
      triggerLoseAnimation();
    }
    
    setGameState("result");
    animateResult();
  };

  const resetGame = async () => {
    setBet(0);
    setCards([]);
    setGameState("betting");
    setResult("");
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setArrangedHands({ hand5: [], hand2: [] });
    await playSound("click");
  };

  const renderCard = (card, index, isHighlighted = false) => {
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
      <Animated.View key={index} style={[
        styles.card, 
        cardAnimation,
        isHighlighted && styles.highlightedCard
      ]}>
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
      </Animated.View>
    );
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animaciones */}
      <WinAnimation show={showWinAnimation} />
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

        {/* Cartas repartidas */}
        {cards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>TUS 7 CARTAS</Text>
              <Text style={styles.areaScore}>
                {gameState === "arranging" ? "ORGANIZAR" : ""}
              </Text>
            </View>
            <View style={styles.cardsContainer}>
              {cards.map((card, index) => renderCard(card, index))}
            </View>
          </View>
        )}

        {/* Manos organizadas (si aplica) */}
        {arrangedHands.hand5.length > 0 && (
          <View style={styles.arrangedHands}>
            <View style={styles.handContainer}>
              <Text style={styles.handTitle}>MANO DE 5 CARTAS</Text>
              <View style={styles.cardsContainer}>
                {arrangedHands.hand5.map((card, index) => renderCard(card, index, true))}
              </View>
            </View>
            <View style={styles.handContainer}>
              <Text style={styles.handTitle}>MANO DE 2 CARTAS</Text>
              <View style={styles.cardsContainer}>
                {arrangedHands.hand2.map((card, index) => renderCard(card, index, true))}
              </View>
            </View>
          </View>
        )}

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
                      gameState === "arranging" ? "ORGANICE SUS CARTAS EN 2 MANOS" : "")}
          </Text>
          {ticketsWon > 0 && gameState === "result" && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
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
                      +{getTicketRewards(amount, true)} tickets
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

          {gameState === "arranging" && (
            <View style={styles.arrangeContainer}>
              <TouchableOpacity 
                style={styles.autoButton} 
                onPress={handleAutoArrange}
              >
                <Ionicons name="color-wand" size={18} color="#FFF" />
                <Text style={styles.autoButtonText}>ORGANIZAR AUTOMÁTICAMENTE</Text>
              </TouchableOpacity>
              <Text style={styles.arrangeHint}>
                Mano de 5 y mano de 2 cartas deben tener al menos un par cada una
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

        {/* Reglas del juego */}
        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>REGLAS DEL PAI GOW POKER</Text>
          <Text style={styles.rule}>• Recibes 7 cartas</Text>
          <Text style={styles.rule}>• Separa en mano de 5 y mano de 2 cartas</Text>
          <Text style={styles.rule}>• Ambas manos deben tener al menos un par</Text>
          <Text style={styles.rule}>• Maneki acepta tu mano si cumple las reglas</Text>
          <Text style={styles.rule}>• Ganas tu apuesta + tickets si es válida</Text>
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
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    width: 50,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    margin: 3,
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
  highlightedCard: {
    borderColor: "#FFD700",
    borderWidth: 2,
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
  arrangedHands: {
    gap: 15,
    marginBottom: 12,
  },
  handContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  handTitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
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
    color: "#10B981",
    fontSize: 10,
    marginTop: 2,
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
  arrangeContainer: {
    alignItems: "center",
    gap: 12,
  },
  autoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 8,
  },
  autoButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  arrangeHint: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
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
  rules: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  rulesTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  rule: {
    color: "#FFF",
    fontSize: 12,
    marginBottom: 5,
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
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});

