// src/games/roulette/Roulette.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
  Vibration,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Text as SvgText, Path } from "react-native-svg";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width: screenWidth } = Dimensions.get("window");

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
        chip: "coin",
        click: "click",
      };

      const soundKey = soundMap[type] || "click";

      if (sounds[soundKey]) {
        // Detener sonido actual si existe
        if (currentSound) {
          try {
            await currentSound.stopAsync();
          } catch (e) {}
        }

        const sound = sounds[soundKey];
        setCurrentSound(sound);

        await sound.replayAsync();

        // Si se especifica una duración, programar parada
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
      // Fallback a vibraciones
      const vibrationMap = {
        win: [0, 100, 50, 100],
        lose: [0, 300, 100, 300],
        spin: 100,
        chip: 50,
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

// Animaciones mejoradas
const WinAnimation = ({ show, ticketsWon = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
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
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
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
      <Ionicons name="trophy" size={60} color="#00BFFF" />
      <Text style={styles.winText}>¡VICTORIA!</Text>
      {ticketsWon > 0 && (
        <View style={styles.ticketsWonContainer}>
          <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
        </View>
      )}
    </Animated.View>
  );
};

const LoseAnimation = ({ show }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  const shake = shakeAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -15, 15, -15, 0],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.loseAnimation,
        {
          transform: [{ scale: scaleAnim }, { translateX: shake }],
        },
      ]}
    >
      <Ionicons name="sad-outline" size={60} color="#EF4444" />
      <Text style={styles.loseText}>SIN PREMIO</Text>
    </Animated.View>
  );
};

// Configuración de la ruleta europea
const SEGMENTS = [
  { num: 0, color: "green" },
  { num: 32, color: "red" },
  { num: 15, color: "black" },
  { num: 19, color: "red" },
  { num: 4, color: "black" },
  { num: 21, color: "red" },
  { num: 2, color: "black" },
  { num: 25, color: "red" },
  { num: 17, color: "black" },
  { num: 34, color: "red" },
  { num: 6, color: "black" },
  { num: 27, color: "red" },
  { num: 13, color: "black" },
  { num: 36, color: "red" },
  { num: 11, color: "black" },
  { num: 30, color: "red" },
  { num: 8, color: "black" },
  { num: 23, color: "red" },
  { num: 10, color: "black" },
  { num: 5, color: "red" },
  { num: 24, color: "black" },
  { num: 16, color: "red" },
  { num: 33, color: "black" },
  { num: 1, color: "red" },
  { num: 20, color: "black" },
  { num: 14, color: "red" },
  { num: 31, color: "black" },
  { num: 9, color: "red" },
  { num: 22, color: "black" },
  { num: 18, color: "red" },
  { num: 29, color: "black" },
  { num: 7, color: "red" },
  { num: 28, color: "black" },
  { num: 12, color: "red" },
  { num: 35, color: "black" },
  { num: 3, color: "red" },
  { num: 26, color: "black" },
];

// Sistema de apuestas profesional - MISMA ESTRUCTURA QUE AMERICANA
const BET_TYPES = {
  RED: {
    type: "RED",
    label: "ROJO",
    multiplier: 2,
    numbers: [
      32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3,
    ],
  },
  BLACK: {
    type: "BLACK",
    label: "NEGRO",
    multiplier: 2,
    numbers: [
      15, 4, 2, 17, 6, 13, 11, 8, 10, 24, 33, 20, 31, 22, 29, 28, 35, 26,
    ],
  },
  EVEN: {
    type: "EVEN",
    label: "PAR",
    multiplier: 2,
    numbers: [32, 4, 2, 34, 6, 36, 8, 10, 24, 16, 20, 22, 18, 28, 12, 26],
  },
  ODD: {
    type: "ODD",
    label: "IMPAR",
    multiplier: 2,
    numbers: [15, 19, 21, 25, 27, 11, 23, 5, 33, 1, 31, 9, 29, 7, 35, 3],
  },
  LOW: {
    type: "LOW",
    label: "1-18",
    multiplier: 2,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  },
  HIGH: {
    type: "HIGH",
    label: "19-36",
    multiplier: 2,
    numbers: [
      19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    ],
  },
  DOZEN_FIRST: {
    type: "DOZEN_FIRST",
    label: "1-12",
    multiplier: 3,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  DOZEN_SECOND: {
    type: "DOZEN_SECOND",
    label: "13-24",
    multiplier: 3,
    numbers: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  },
  DOZEN_THIRD: {
    type: "DOZEN_THIRD",
    label: "25-36",
    multiplier: 3,
    numbers: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  },
  COLUMN_FIRST: {
    type: "COLUMN_FIRST",
    label: "2:1",
    multiplier: 3,
    numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  },
  COLUMN_SECOND: {
    type: "COLUMN_SECOND",
    label: "2:1",
    multiplier: 3,
    numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  },
  COLUMN_THIRD: {
    type: "COLUMN_THIRD",
    label: "2:1",
    multiplier: 3,
    numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  },
  ZERO: {
    type: "ZERO",
    label: "0",
    multiplier: 36,
    numbers: [0],
  },
  STRAIGHT: {
    type: "STRAIGHT",
    label: "PLENO",
    multiplier: 36,
    numbers: [],
  },
};

const BET_GROUPS = [
  [BET_TYPES.RED, BET_TYPES.BLACK, BET_TYPES.EVEN, BET_TYPES.ODD],
  [
    BET_TYPES.LOW,
    BET_TYPES.HIGH,
    BET_TYPES.DOZEN_FIRST,
    BET_TYPES.DOZEN_SECOND,
    BET_TYPES.DOZEN_THIRD,
  ],
  [BET_TYPES.COLUMN_FIRST, BET_TYPES.COLUMN_SECOND, BET_TYPES.COLUMN_THIRD],
  [BET_TYPES.ZERO, BET_TYPES.STRAIGHT],
];

// Colores de apuestas - AZULES EN LUGAR DE DORADOS
const getBetColor = (type) => {
  const colors = {
    RED: "#DC2626",
    BLACK: "#1F2937",
    EVEN: "#2563EB",
    ODD: "#0369A1",
    LOW: "#1D4ED8",
    HIGH: "#DC2626",
    DOZEN_FIRST: "#059669",
    DOZEN_SECOND: "#D97706",
    DOZEN_THIRD: "#7C3AED",
    COLUMN_FIRST: "#2563EB",
    COLUMN_SECOND: "#DC2626",
    COLUMN_THIRD: "#059669",
    ZERO: "#059669",
    STRAIGHT: "#7C3AED",
  };
  return colors[type] || "#374151";
};

// Tabla de premios de tickets para la ruleta (MISMO SISTEMA)
const getTicketRewards = (betAmount, multiplier = 1) => {
  // Base tickets basado en la apuesta y multiplicador
  const baseTickets = Math.floor(betAmount * 0.1); // 10% de la apuesta base
  const multiplierBonus = Math.floor((multiplier - 1) * betAmount * 0.05); // Bonus por multiplicador

  return Math.max(baseTickets + multiplierBonus, 1); // Mínimo 1 ticket
};

export default function Roulette({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const { playSound, stopSound } = useGameSounds();

  const [betAmount, setBetAmount] = useState(0);
  const [betType, setBetType] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [history, setHistory] = useState([]);
  const [showNumberModal, setShowNumberModal] = useState(false);
  const [showWinAnim, setShowWinAnim] = useState(false);
  const [showLoseAnim, setShowLoseAnim] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [betStep, setBetStep] = useState("amount");
  const [ticketsWon, setTicketsWon] = useState(0);

  // New states for marking the result and index
  const [landedNumber, setLandedNumber] = useState(null);
  const [landedIndex, setLandedIndex] = useState(null);

  const wheelAnim = useRef(new Animated.Value(0)).current;
  // ballAnim kept for compatibility (not used for visible ball orbit)
  const ballAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // pointerBallAnim will animate the new ball that lives at the pointer position
  const pointerBallAnim = useRef(new Animated.Value(0)).current;
  const pointerBallLoopRef = useRef(null);

  // Configuración de la ruleta
  const wheelSize = Math.min(screenWidth - 40, 320);
  const center = wheelSize / 2;
  const wheelRadius = wheelSize / 2 - 10;
  const ballTrackRadius = wheelRadius - 15;
  const segmentAngle = (2 * Math.PI) / SEGMENTS.length;
  const segmentDegrees = 360 / SEGMENTS.length;

  // Función para dibujar segmentos
  const createSegmentPath = (index) => {
    const startAngle = index * segmentAngle - Math.PI / 2;
    const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

    const x1 = center + wheelRadius * Math.cos(startAngle);
    const y1 = center + wheelRadius * Math.sin(startAngle);
    const x2 = center + wheelRadius * Math.cos(endAngle);
    const y2 = center + wheelRadius * Math.sin(endAngle);

    return `M ${center} ${center} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 0 1 ${x2} ${y2} Z`;
  };

  // Animación de pulso
  const animatePulse = () => {
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

  // Seleccionar cantidad de apuesta
  const selectBetAmount = async (amount) => {
    if (!canAfford(amount)) {
      await playSound("error");
      Alert.alert("Fondos insuficientes", `Necesita ${amount} coins`);
      return;
    }
    setBetAmount(amount);
    setBetStep("type");
    await playSound("chip");
    animatePulse();
  };

  // Seleccionar tipo de apuesta
  const selectBetType = async (type, number = null) => {
    if (spinning) {
      Alert.alert("Espere", "La ruleta está girando");
      return;
    }

    if (type === "STRAIGHT") {
      setShowNumberModal(true);
      return;
    }

    // Al seleccionar tipo, descontamos la apuesta
    subtractCoins(betAmount, `Apuesta ${BET_TYPES[type].label}`);
    setBetType(type);
    setSelectedNumber(number);
    await playSound("chip");
    animatePulse();
  };

  // Confirmar número para apuesta directa
  const confirmStraightBet = async (number) => {
    setSelectedNumber(number);
    setShowNumberModal(false);
    subtractCoins(betAmount, `Apuesta Número ${number}`);
    setBetType("STRAIGHT");
    await playSound("chip");
    animatePulse();
  };

  // Animación de la bola en la posición del puntero:
  const startPointerBallLoop = () => {
    // pequeña vibración/oscillación mientras gira la rueda
    pointerBallLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pointerBallAnim, {
          toValue: -6,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pointerBallAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pointerBallLoopRef.current.start();
  };

  const stopPointerBallLoopAndBounce = () => {
    try {
      pointerBallLoopRef.current?.stop();
    } catch (e) {}
    // Al caer: pequeño "drop" -> rebote
    Animated.sequence([
      Animated.timing(pointerBallAnim, {
        toValue: 6,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pointerBallAnim, {
        toValue: 0,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Girar ruleta
  const spinWheel = async () => {
    if (spinning || !betAmount || !betType) return;

    setSpinning(true);
    setLandedNumber(null);
    setLandedIndex(null);

    // Duración del giro (en ms)
    const spinDuration = 5000;

    // Reproducir sonido de giro por la duración completa
    await playSound("spin", spinDuration);

    // Elegimos el índice ganador aleatoriamente
    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    const winningNumber = SEGMENTS[winningIndex].num;

    // Número de vueltas completas para la rueda (aleatorio para naturalidad)
    const spins = 4 + Math.floor(Math.random() * 4); // entre 4 y 7 vueltas
    // Para la bola, más vueltas en sentido contrario para simular física
    const ballSpins = spins * 1.8;

    // --- CÁLCULO EXACTO PARA QUE EL NÚMERO GANADOR QUEDE BAJO EL PUNTERO ----
    // rotationOffset: cantidad en grados para alinear el medio del segmento con el tope (-90°)
    const rotationOffset =
      (360 - ((winningIndex + 0.5) * segmentDegrees) % 360) % 360;

    const wheelTo = spins * 360 + rotationOffset;
    const ballTo = -Math.round(ballSpins * 360) - 90;

    // Reiniciar animaciones
    wheelAnim.setValue(0);
    ballAnim.setValue(0);
    pointerBallAnim.setValue(0);

    // iniciar oscilación de la bola en el puntero (reemplaza el triángulo)
    startPointerBallLoop();

    // Ejecutar animaciones en paralelo; la bola (simulada) termina un poco antes que la rueda
    Animated.parallel([
      Animated.timing(wheelAnim, {
        toValue: wheelTo,
        duration: spinDuration + 300, // rueda termina un poco después
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ballAnim, {
        toValue: ballTo,
        duration: spinDuration - 300, // sólo interno/no visible
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Parar la oscilación y hacer bounce
      stopPointerBallLoopAndBounce();

      // Mostrar número y resaltar segmento
      setLandedNumber(winningNumber);
      setLandedIndex(winningIndex);

      // Calcular ganancia
      const betConfig = BET_TYPES[betType];
      let winAmount = 0;
      let ticketsEarned = 0;

      if (betType === "STRAIGHT" && selectedNumber === winningNumber) {
        winAmount = betAmount * betConfig.multiplier;
        ticketsEarned = getTicketRewards(betAmount, betConfig.multiplier);
      } else if (betConfig.numbers.includes(winningNumber)) {
        winAmount = betAmount * betConfig.multiplier;
        ticketsEarned = getTicketRewards(betAmount, betConfig.multiplier);
      }

      // Actualizar estado
      if (winAmount > 0) {
        // Solo agregar ganancia neta (restar la apuesta inicial que ya fue descontada)
        const netWin = winAmount - betAmount;
        if (netWin > 0) {
          addCoins(netWin, `Ganó ${winAmount} coins`);
        }

        // Agregar tickets ganados
        if (ticketsEarned > 0) {
          await addTickets(ticketsEarned, `Ganancia en Ruleta - Tickets`);
          setTicketsWon(ticketsEarned);
        }

        await playSound("win");
        setShowWinAnim(true);
        setTimeout(() => setShowWinAnim(false), 2000);
      } else {
        await playSound("lose");
        setShowLoseAnim(true);
        setTimeout(() => setShowLoseAnim(false), 2000);
      }

      // Actualizar historial
      setHistory((prev) => [
        {
          number: winningNumber,
          color: SEGMENTS[winningIndex].color,
          win: winAmount,
          tickets: ticketsEarned,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 5),
      ]);

      // Resetear juego después de mostrar resultado (dejamos resalte visible un rato)
      setTimeout(() => {
        setBetAmount(0);
        setBetType(null);
        setSelectedNumber(null);
        setBetStep("amount");
        setSpinning(false);
        setTicketsWon(0);

        // dejamos landedNumber/landedIndex unos momentos más para que el usuario vea el resultado
        setTimeout(() => {
          setLandedNumber(null);
          setLandedIndex(null);
        }, 1200);
      }, 1500);
    });
  };

  // Limpiar apuesta
  const clearBet = async () => {
    if (!spinning && betAmount > 0) {
      if (betType) {
        addCoins(betAmount, "Apuesta cancelada");
      }
      setBetAmount(0);
      setBetType(null);
      setSelectedNumber(null);
      setBetStep("amount");
      await playSound("click");
    }
  };

  // Interpolaciones para animaciones
  const wheelRotation = wheelAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const ballRotation = ballAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ["-360deg", "0deg", "360deg"],
  });

  // pointerBall translateY for the pointer ball (visible)
  const pointerBallTranslateY = pointerBallAnim.interpolate({
    inputRange: [-20, 20],
    outputRange: [-20, 20],
  });

  // Modal de selección de números
  const NumberModal = () => (
    <Modal visible={showNumberModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>SELECCIONE NÚMERO</Text>
          <Text style={styles.modalSubtitle}>Pago 35:1</Text>

          <View style={styles.numberGrid}>
            {[...Array(37).keys()].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  selectedNumber === num && styles.selectedNumber,
                ]}
                onPress={() => confirmStraightBet(num)}
              >
                <Text
                  style={[
                    styles.numberText,
                    selectedNumber === num && styles.selectedNumberText,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowNumberModal(false)}
          >
            <Text style={styles.closeModalText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <WinAnimation show={showWinAnim} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnim} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header profesional con saldo y tickets */}
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

          <View style={styles.titleContainer}>
            <Text style={styles.title}></Text>
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Información de apuesta actual */}
        {(betAmount > 0 || betType) && (
          <View style={styles.currentBetInfo}>
            <View style={styles.betDetails}>
              <Text style={styles.betAmount}>{betAmount} MC</Text>
              <Text style={styles.betType}>
                {betType ? BET_TYPES[betType]?.label : "Seleccione tipo"}
                {selectedNumber !== null && ` - ${selectedNumber}`}
              </Text>
            </View>
            <TouchableOpacity onPress={clearBet} style={styles.clearButton}>
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Selector de cantidad */}
        {betStep === "amount" && (
          <View style={styles.betSelector}>
            <Text style={styles.sectionTitle}>SELECCIONE SU APUESTA</Text>
            <View style={styles.betAmounts}>
              {[10, 50, 100, 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    betAmount === amount && styles.selectedAmount,
                    !canAfford(amount) && styles.disabledAmount,
                  ]}
                  onPress={() => selectBetAmount(amount)}
                  disabled={!canAfford(amount)}
                >
                  <Text
                    style={[
                      styles.amountText,
                      betAmount === amount && styles.selectedAmountText,
                      !canAfford(amount) && styles.disabledAmountText,
                    ]}
                  >
                    {amount}
                  </Text>
                  <Text style={styles.ticketRewardText}>
                    +{getTicketRewards(amount, 2)} tickets
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Selector de tipo de apuesta */}
        {betStep === "type" && (
          <View style={styles.betTypeSelector}>
            <Text style={styles.sectionTitle}>SELECCIONE TIPO DE APUESTA</Text>
            <View style={styles.betsPanel}>
              {BET_GROUPS.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.betGroup}>
                  {group.map((betTypeConfig) => (
                    <TouchableOpacity
                      key={betTypeConfig.type}
                      style={[
                        styles.betOption,
                        { backgroundColor: getBetColor(betTypeConfig.type) },
                        betType === betTypeConfig.type && styles.selectedBet,
                      ]}
                      onPress={() => selectBetType(betTypeConfig.type)}
                      disabled={spinning}
                    >
                      <Text style={styles.betOptionText}>
                        {betTypeConfig.label}
                      </Text>
                      <Text style={styles.betMultiplier}>
                        {betTypeConfig.multiplier}x
                      </Text>
                      <Text style={styles.ticketRewardSmall}>
                        +{getTicketRewards(betAmount, betTypeConfig.multiplier)}{" "}
                        tickets
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ruleta */}
        <View style={styles.wheelSection}>
          <View
            style={[
              styles.wheelContainer,
              { width: wheelSize, height: wheelSize },
            ]}
          >
            {/* Borde azul exterior */}
            <View
              style={[
                styles.blueBorder,
                {
                  width: wheelSize + 8,
                  height: wheelSize + 8,
                  borderRadius: (wheelSize + 8) / 2,
                },
              ]}
            />

            {/* Ruleta animada */}
            <Animated.View
              style={[
                styles.wheel,
                {
                  width: wheelSize,
                  height: wheelSize,
                  transform: [{ rotate: wheelRotation }],
                  borderRadius: wheelSize / 2,
                },
              ]}
            >
              <Svg width={wheelSize} height={wheelSize}>
                {/* Fondo */}
                <Circle cx={center} cy={center} r={wheelRadius} fill="#1a1a1a" />

                {/* Segmentos */}
                {SEGMENTS.map((segment, index) => (
                  <Path
                    key={index}
                    d={createSegmentPath(index)}
                    fill={
                      segment.color === "red"
                        ? "#DC2626"
                        : segment.color === "black"
                        ? "#1F2937"
                        : "#059669"
                    }
                    stroke={
                      // Si es el segmento ganador (landedIndex), lo resaltamos con borde claro
                      index === landedIndex ? "#FFD54D" : "#0F0F0F"
                    }
                    strokeWidth={index === landedIndex ? 3 : 1}
                  />
                ))}

                {/* Números */}
                {SEGMENTS.map((segment, index) => {
                  // Calcular el ángulo del centro del segmento
                  const midAngle =
                    index * segmentAngle + segmentAngle / 2 - Math.PI / 2;
                  const textRadius = wheelRadius - 25; // Ajustado para mejor posicionamiento

                  // Si es el segmento ganador, le cambiamos color o tamaño para resaltar
                  const isLanded = index === landedIndex;

                  return (
                    <SvgText
                      key={index}
                      x={center + textRadius * Math.cos(midAngle)}
                      y={center + textRadius * Math.sin(midAngle)}
                      fontSize={isLanded ? 13 : 11}
                      fontWeight="bold"
                      fill={isLanded ? "#FFF59D" : "#FFFFFF"}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      transform={`rotate(${midAngle * (180 / Math.PI) + 90}, ${
                        center + textRadius * Math.cos(midAngle)
                      }, ${center + textRadius * Math.sin(midAngle)})`}
                    >
                      {segment.num}
                    </SvgText>
                  );
                })}

                {/* Centro */}
                <Circle cx={center} cy={center} r={6} fill="#00BFFF" />
              </Svg>
            </Animated.View>

            {/* --- NUEVO: Bola blanca en la posición del puntero (reemplaza el triángulo) --- */}
            <Animated.View
              style={[
                styles.pointerBall,
                {
                  transform: [{ translateY: pointerBallTranslateY }],
                },
              ]}
            />

            {/* Indicador de número caído (sobre el puntero) */}
            {landedNumber !== null && (
              <View style={styles.resultBadge}>
                <Text style={styles.resultBadgeText}>{landedNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón de girar */}
        <TouchableOpacity
          style={[
            styles.spinButton,
            (spinning || !betAmount || !betType) && styles.spinButtonDisabled,
          ]}
          onPress={spinWheel}
          disabled={spinning || !betAmount || !betType}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? "GIRANDO..." : "GIRAR RULETA"}
          </Text>
        </TouchableOpacity>

        {/* Historial compacto */}
        {history.length > 0 && (
          <View style={styles.historyPanel}>
            <Text style={styles.sectionTitle}>ÚLTIMOS RESULTADOS</Text>
            <View style={styles.historyList}>
              {history.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View
                    style={[
                      styles.numberBadge,
                      {
                        backgroundColor:
                          item.color === "red"
                            ? "#DC2626"
                            : item.color === "black"
                            ? "#1F2937"
                            : "#059669",
                      },
                    ]}
                  >
                    <Text style={styles.historyNumber}>{item.number}</Text>
                  </View>
                  {item.win > 0 && (
                    <View style={styles.winInfo}>
                      <Text style={styles.winAmount}>+{item.win} MC</Text>
                      {item.tickets > 0 && (
                        <Text style={styles.ticketAmount}>
                          +{item.tickets} tickets
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <NumberModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Header mejorado con saldo y tickets - MISMA ESTRUCTURA QUE AMERICANA
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
    borderColor: "#00BFFF", // AZUL en lugar de dorado
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
    color: "#00BFFF", // AZUL en lugar de dorado
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
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  emptySpace: {
    width: 80,
  },
  currentBetInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  betDetails: {
    flex: 1,
  },
  betAmount: {
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 16,
    fontWeight: "bold",
  },
  betType: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
  clearButton: {
    padding: 4,
  },
  betSelector: {
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  betTypeSelector: {
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  selectedAmount: {
    backgroundColor: "#00BFFF", // AZUL en lugar de dorado
  },
  disabledAmount: {
    opacity: 0.4,
  },
  amountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedAmountText: {
    color: "#000000",
  },
  disabledAmountText: {
    color: "#9CA3AF",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "bold",
  },
  wheelSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  wheelContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  // Borde azul para la ruleta
  blueBorder: {
    position: "absolute",
    backgroundColor: "transparent",
    borderWidth: 4,
    borderColor: "#00BFFF", // AZUL en lugar de dorado
    zIndex: 5,
  },
  wheel: {
    position: "absolute",
    overflow: "hidden",
  },
  // Estilo de la bola que ahora vive en la posición del puntero
  pointerBall: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    elevation: 10,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 30,
    borderWidth: 1,
    borderColor: "#111827",
  },
  // --- Eliminado el triángulo puntero; ahora la bola es el puntero ---
  resultBadge: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD54D",
    zIndex: 30,
  },
  resultBadgeText: {
    color: "#FFD54D",
    fontWeight: "bold",
    fontSize: 12,
  },
  spinButton: {
    backgroundColor: "#00BFFF", // AZUL en lugar de dorado
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  spinButtonDisabled: {
    backgroundColor: "#374151",
    opacity: 0.6,
  },
  spinButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  betsPanel: {
    marginTop: 8,
  },
  betGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  betOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
  },
  selectedBet: {
    borderWidth: 2,
    borderColor: "#00BFFF", // AZUL en lugar de dorado
  },
  betOptionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  betMultiplier: {
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 2,
  },
  ticketRewardSmall: {
    color: "#10B981",
    fontSize: 7,
    marginTop: 1,
    fontWeight: "bold",
  },
  historyPanel: {
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  historyList: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  numberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 30,
    alignItems: "center",
  },
  historyNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  winInfo: {
    alignItems: "flex-start",
  },
  winAmount: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
  },
  ticketAmount: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  numberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  numberButton: {
    width: 40,
    height: 40,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  selectedNumber: {
    backgroundColor: "#00BFFF", // AZUL en lugar de dorado
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedNumberText: {
    color: "#000000",
  },
  closeModalButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeModalText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -80,
    marginTop: -80,
    width: 160,
    height: 160,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    borderWidth: 3,
  },
  winAnimation: {
    borderColor: "#00BFFF", // AZUL en lugar de dorado
  },
  loseAnimation: {
    borderColor: "#DC2626",
  },
  winText: {
    color: "#00BFFF", // AZUL en lugar de dorado
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  loseText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
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
});
