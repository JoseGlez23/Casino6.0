// src/games/dice/SicBo.js
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
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Tabla de premios de tickets para Sic Bo
const getTicketRewards = (betAmount, betType) => {
  const multipliers = {
    small: 2,
    big: 2,
    double: 10,
    triple: 30,
    any_triple: 30,
  };

  const baseTickets = betAmount * 0.5; // 0.5 tickets por cada coin apostado
  const multiplier = multipliers[betType] || 1;

  return Math.floor(baseTickets * multiplier);
};

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
        { key: "dice", file: require("../../assets/sounds/dice.mp3") },
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
          console.log(`Error cargando sonido ${key}:`, error);
        }
      }
      setSounds(soundObjects);
    } catch (error) {
      console.log("Error inicializando sonido:", error);
    }
  };

  const playSound = async (type) => {
    try {
      const soundKey =
        {
          win: "success",
          lose: "error",
          dice: "dice",
          coin: "coin",
          click: "click",
        }[type] || "click";

      if (sounds[soundKey]) {
        await sounds[soundKey].replayAsync();
      } else {
        Vibration.vibrate(type === "win" ? [0, 100, 50, 100] : 15);
      }
    } catch (error) {
      Vibration.vibrate(15);
    }
  };

  useEffect(() => {
    loadSounds();
    return () => {
      Object.values(sounds).forEach((sound) => sound?.unloadAsync());
    };
  }, []);

  return playSound;
};

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
      <Text style={styles.loseSubtext}>Pierdes la apuesta</Text>
    </Animated.View>
  );
};

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
            toValue: 1.1,
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
      <Text style={styles.winSubtext}>Ganas tickets</Text>
      {ticketsWon > 0 && (
        <Text style={styles.ticketsWonAnimation}>+{ticketsWon} Tickets</Text>
      )}
    </Animated.View>
  );
};

const Dice = ({ value, animation, index }) => {
  const diceDots = {
    1: [{ top: "50%", left: "50%" }],
    2: [
      { top: "25%", left: "25%" },
      { top: "75%", left: "75%" },
    ],
    3: [
      { top: "25%", left: "25%" },
      { top: "50%", left: "50%" },
      { top: "75%", left: "75%" },
    ],
    4: [
      { top: "25%", left: "25%" },
      { top: "25%", left: "75%" },
      { top: "75%", left: "25%" },
      { top: "75%", left: "75%" },
    ],
    5: [
      { top: "25%", left: "25%" },
      { top: "25%", left: "75%" },
      { top: "50%", left: "50%" },
      { top: "75%", left: "25%" },
      { top: "75%", left: "75%" },
    ],
    6: [
      { top: "25%", left: "25%" },
      { top: "25%", left: "75%" },
      { top: "50%", left: "25%" },
      { top: "50%", left: "75%" },
      { top: "75%", left: "25%" },
      { top: "75%", left: "75%" },
    ],
  };

  const diceAnimation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "720deg"],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 1.2, 1],
        }),
      },
    ],
    opacity: animation.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.8, 1],
    }),
  };

  return (
    <Animated.View style={[styles.dice, diceAnimation]}>
      <View style={styles.diceFace}>
        {diceDots[value].map((dot, dotIndex) => (
          <View
            key={dotIndex}
            style={[
              styles.diceDot,
              {
                top: dot.top,
                left: dot.left,
                transform: [{ translateX: -3 }, { translateY: -3 }],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

export default function SicBo({ navigation }) {
  const { manekiCoins, tickets, subtractCoins, addTickets, canAfford } =
    useCoins();
  const playSound = useGameSounds();

  const [bet, setBet] = useState(0);
  const [dice, setDice] = useState([1, 1, 1]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [betType, setBetType] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);

  const diceAnimations = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ])[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const animateDice = (index) => {
    diceAnimations[index].setValue(0);
    Animated.timing(diceAnimations[index], {
      toValue: 1,
      duration: 400 + index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const triggerWinAnimation = (tickets = 0) => {
    setTicketsWon(tickets);
    setShowWinAnimation(true);
    setTimeout(() => {
      setShowWinAnimation(false);
      setTicketsWon(0);
    }, 2000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2000);
  };

  const placeBet = async (amount, type) => {
    if (!canAfford(amount)) {
      playSound("error");
      Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins");
      return;
    }

    try {
      await subtractCoins(amount, `Sic Bo - ${type}`);
      playSound("coin");
      setBet(amount);
      setBetType(type);
      setGameState("rolling");
      setIsRolling(true);
      setResult("");

      diceAnimations.forEach((_, index) => animateDice(index));
      playSound("dice");

      setTimeout(async () => {
        const roll1 = Math.floor(Math.random() * 6) + 1;
        const roll2 = Math.floor(Math.random() * 6) + 1;
        const roll3 = Math.floor(Math.random() * 6) + 1;
        const total = roll1 + roll2 + roll3;

        setDice([roll1, roll2, roll3]);
        setIsRolling(false);

        let ticketsReward = 0;
        let resultText = "";

        if (type === "small" && total >= 4 && total <= 10) {
          ticketsReward = getTicketRewards(amount, "small");
          resultText = `¡Pequeño! ${total}`;
          playSound("win");
          triggerWinAnimation(ticketsReward);
        } else if (type === "big" && total >= 11 && total <= 17) {
          ticketsReward = getTicketRewards(amount, "big");
          resultText = `¡Grande! ${total}`;
          playSound("win");
          triggerWinAnimation(ticketsReward);
        } else if (
          (type === "triple" || type === "any_triple") &&
          roll1 === roll2 &&
          roll2 === roll3
        ) {
          ticketsReward = getTicketRewards(amount, "triple");
          resultText = `¡TRIPLE ${roll1}!`;
          playSound("win");
          triggerWinAnimation(ticketsReward);
        } else if (
          type === "double" &&
          (roll1 === roll2 || roll2 === roll3 || roll1 === roll3)
        ) {
          ticketsReward = getTicketRewards(amount, "double");
          resultText = `¡DOBLE!`;
          playSound("win");
          triggerWinAnimation(ticketsReward);
        } else {
          resultText = `Total: ${total}. Sin premio`;
          playSound("lose");
          triggerLoseAnimation();
        }

        // Procesar SOLO tickets si hay ganancia
        // NO agregar coins adicionales
        if (ticketsReward > 0) {
          await addTickets(ticketsReward, `Ganancia Sic Bo - ${type}`);
        }

        setResult(resultText);
        setGameState("result");
      }, 1200);
    } catch (error) {
      console.error("Error en apuesta:", error);
      setIsRolling(false);
      setGameState("betting");
    }
  };

  const resetGame = async () => {
    setBet(0);
    setBetType("");
    setGameState("betting");
    setResult("");
    playSound("click");
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <View style={styles.container}>
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} />

      <View style={styles.header}>
        {/* Saldo y Tickets */}
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
        <View style={styles.emptySpace} />
      </View>

      <View style={styles.diceContainer}>
        {dice.map((die, index) => (
          <Dice
            key={index}
            value={die}
            animation={diceAnimations[index]}
            index={index}
          />
        ))}
      </View>

      <Text style={styles.total}>Total: {dice.reduce((a, b) => a + b, 0)}</Text>

      {result ? (
        <View
          style={[
            styles.messageContainer,
            result.includes("¡") ? styles.winMessage : styles.loseMessage,
          ]}
        >
          <Text
            style={[
              styles.result,
              result.includes("¡") ? styles.winText : styles.loseText,
            ]}
          >
            {result}
          </Text>
          {ticketsWon > 0 && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
            </View>
          )}
          {bet > 0 && (
            <Text style={styles.betInfo}>
              Apuesta: {bet.toLocaleString()} MC
            </Text>
          )}
        </View>
      ) : null}

      <View style={styles.controls}>
        {gameState === "betting" && (
          <View style={styles.betContainer}>
            <Text style={styles.betTitle}>APUESTA: {bet} MC</Text>

            <View style={styles.betAmounts}>
              {betAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    !canAfford(amount) && styles.disabledButton,
                    bet === amount && styles.selectedBet,
                  ]}
                  onPress={() => {
                    if (canAfford(amount)) {
                      setBet(amount);
                      playSound("click");
                    }
                  }}
                  disabled={!canAfford(amount)}
                >
                  <Text style={styles.amountButtonText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.betTypeTitle}>TIPO DE APUESTA:</Text>

            {/* Botones de tipo de apuesta en 2 columnas */}
            <View style={styles.betTypesGrid}>
              <View style={styles.betTypeColumn}>
                <TouchableOpacity
                  style={[
                    styles.betType,
                    { backgroundColor: "#2563EB" },
                    bet === 0 && styles.disabledButton,
                  ]}
                  onPress={() => placeBet(bet, "small")}
                  disabled={bet === 0 || isRolling}
                >
                  <Text style={styles.betTypeText}>Pequeño</Text>
                  <Text style={styles.betTypeSubtext}>(4-10)</Text>
                  <Text style={styles.ticketRewardInfo}>
                    +{getTicketRewards(bet, "small")} tickets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.betType,
                    { backgroundColor: "#059669" },
                    bet === 0 && styles.disabledButton,
                  ]}
                  onPress={() => placeBet(bet, "double")}
                  disabled={bet === 0 || isRolling}
                >
                  <Text style={styles.betTypeText}>Doble</Text>
                  <Text style={styles.betTypeSubtext}>Cualquier doble</Text>
                  <Text style={styles.ticketRewardInfo}>
                    +{getTicketRewards(bet, "double")} tickets
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.betTypeColumn}>
                <TouchableOpacity
                  style={[
                    styles.betType,
                    { backgroundColor: "#DC2626" },
                    bet === 0 && styles.disabledButton,
                  ]}
                  onPress={() => placeBet(bet, "big")}
                  disabled={bet === 0 || isRolling}
                >
                  <Text style={styles.betTypeText}>Grande</Text>
                  <Text style={styles.betTypeSubtext}>(11-17)</Text>
                  <Text style={styles.ticketRewardInfo}>
                    +{getTicketRewards(bet, "big")} tickets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.betType,
                    { backgroundColor: "#7C3AED" },
                    bet === 0 && styles.disabledButton,
                  ]}
                  onPress={() => placeBet(bet, "triple")}
                  disabled={bet === 0 || isRolling}
                >
                  <Text style={styles.betTypeText}>Triple</Text>
                  <Text style={styles.betTypeSubtext}>3 dados iguales</Text>
                  <Text style={styles.ticketRewardInfo}>
                    +{getTicketRewards(bet, "triple")} tickets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {(gameState === "result" || gameState === "rolling") && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetGame}
            disabled={isRolling}
          >
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.resetButtonText}>
              {isRolling ? "TIRANDO..." : "JUGAR OTRA VEZ"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    padding: 12,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 20,
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
  title: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
    marginTop: 5,
  },
  emptySpace: {
    width: 50,
  },
  diceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
  },
  dice: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  diceFace: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  diceDot: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "#000000",
    borderRadius: 4,
  },
  total: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
    width: "90%",
  },
  winMessage: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  loseMessage: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  result: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  winText: {
    color: "#10B981",
  },
  loseText: {
    color: "#EF4444",
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
  betInfo: {
    color: "#FFF",
    fontSize: 11,
    marginTop: 6,
    opacity: 0.8,
  },
  controls: {
    alignItems: "center",
    width: "100%",
    marginTop: 5,
  },
  betContainer: {
    alignItems: "center",
    width: "100%",
  },
  betTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 8,
  },
  amountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 50,
    alignItems: "center",
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  amountButtonText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  betTypeTitle: {
    color: "#FFF",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  betTypesGrid: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    justifyContent: "space-between",
  },
  betTypeColumn: {
    flex: 1,
    gap: 8,
  },
  betType: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  betTypeText: {
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 2,
  },
  betTypeSubtext: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 10,
    opacity: 0.9,
    marginBottom: 2,
  },
  ticketRewardInfo: {
    color: "#10B981",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
  },
  resetButton: {
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
  resetButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  animationContainer: {
    position: "absolute",
    top: height / 2 - 80,
    left: width / 2 - 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    width: 200,
    height: 150,
    elevation: 15,
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
    marginTop: 8,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  winSubtext: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  loseSubtext: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  ticketsWonAnimation: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
});
