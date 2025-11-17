// src/games/specialty/PaiGow.js
import React, { useState, useEffect, useRef } from "react";
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
  BackHandler,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Componente de Modal de Bloqueo - Solo imagen grande con auto-cierre de 3 segundos
const BlockModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-cierre después de 3 segundos
      const timer = setTimeout(() => {
        // Animación de salida
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Resetear animaciones cuando no es visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayTransparent}>
        <Animated.View 
          style={[
            styles.blockModalContainerTransparent,
            { 
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
              opacity: fadeAnim 
            }
          ]}
        >
          <Image 
            source={require("../../assets/notesalgas.png")}
            style={styles.probabilityImageLarge}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Hook de sonidos mejorado
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);

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
        { key: "shuffle", file: require("../../assets/sounds/shuffle.mp3") },
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
    if (!soundEnabled) return;
    
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
        case "shuffle":
          soundKey = "shuffle";
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
      case "shuffle":
        Vibration.vibrate([0, 50, 20, 50]);
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

  const toggleSound = () => setSoundEnabled(!soundEnabled);

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

  return { playSound, soundEnabled, toggleSound };
};

// Componente de animación de victoria mejorado
const WinAnimation = ({ show, ticketsWon }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      // Animación principal
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Animación de pulso continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
      confettiAnim.setValue(0);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.winAnimation,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name="trophy" size={80} color="#FFD700" />
      </Animated.View>
      <Text style={styles.winText}>¡MANO VÁLIDA!</Text>
      {ticketsWon > 0 && (
        <Animated.Text 
          style={[
            styles.ticketsWonAnimation,
            { opacity: confettiAnim }
          ]}
        >
          +{ticketsWon} Tickets
        </Animated.Text>
      )}
    </Animated.View>
  );
};

// Componente de animación de pérdida mejorado
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
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.loseAnimation,
        {
          transform: [
            { scale: scaleAnim }, 
            { translateX: shakeInterpolation }
          ],
        },
      ]}
    >
      <Ionicons name="close-circle" size={80} color="#EF4444" />
      <Text style={styles.loseText}>MANO NO VÁLIDA</Text>
    </Animated.View>
  );
};

// Componente de animación de reparto de cartas
const CardDealAnimation = ({ cards, onComplete }) => {
  const [animatedCards, setAnimatedCards] = useState([]);

  useEffect(() => {
    if (cards.length === 0) return;

    // Inicializar animaciones para cada carta
    const cardAnimations = cards.map((_, index) => new Animated.Value(0));
    setAnimatedCards(cardAnimations);

    // Animar cartas en secuencia
    const animations = cardAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 150),
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ])
    );

    Animated.stagger(100, animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [cards]);

  if (cards.length === 0 || animatedCards.length === 0) return null;

  return (
    <View style={styles.cardsContainer}>
      {cards.map((card, index) => {
        const cardAnimation = animatedCards[index];
        
        if (!cardAnimation) return null;

        const animatedStyle = {
          transform: [
            {
              translateY: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
            {
              scale: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
            {
              rotate: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['-10deg', '0deg'],
              }),
            }
          ],
          opacity: cardAnimation,
        };

        return (
          <Animated.View key={index} style={[styles.card, animatedStyle]}>
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
        );
      })}
    </View>
  );
};

// Función auxiliar para color de cartas
const getCardColor = (suit) => {
  return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
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
  return isWin ? baseTickets : 0;
};

// Evaluación de manos para Pai Gow mejorada
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
  const maxCount = Math.max(...Object.values(valueCounts));
  
  if (hand.length === 5) {
    // Evaluación para mano de 5 cartas
    const isFlush = new Set(suits).size === 1;
    const isStraight = checkStraight(values);
    
    if (isFlush && isStraight && Math.max(...values) === 14) return 10; // Escalera real
    if (isFlush && isStraight) return 9; // Escalera de color
    if (maxCount === 4) return 8; // Póker
    if (maxCount === 3 && Object.values(valueCounts).includes(2)) return 7; // Full
    if (isFlush) return 6; // Color
    if (isStraight) return 5; // Escalera
    if (maxCount === 3) return 4; // Trío
    if (Object.values(valueCounts).filter(count => count === 2).length === 2) return 3; // Doble pareja
    if (maxCount === 2) return 2; // Pareja
    return 1; // Carta alta
  } else {
    // Evaluación para mano de 2 cartas
    if (maxCount === 2) return 2; // Pareja
    return 1; // Carta alta
  }
};

const checkStraight = (values) => {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  
  // Verificar escalera normal
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i + 4] - uniqueValues[i] === 4) return true;
  }
  
  // Verificar escalera baja (A-2-3-4-5)
  if (uniqueValues.includes(14) && uniqueValues.includes(2) && 
      uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
    return true;
  }
  
  return false;
};

// Algoritmo de organización automática mejorado
const autoArrangeCards = (cards) => {
  const sortedCards = [...cards].sort((a, b) => b.numeric - a.numeric);
  
  // Estrategia: intentar crear la mejor mano de 5 posible
  let bestArrangement = null;
  let bestScore = -1;
  
  // Generar combinaciones posibles
  const combinations = generateCombinations(sortedCards);
  
  for (const combo of combinations) {
    const hand5 = combo;
    const hand2 = sortedCards.filter(card => !hand5.includes(card));
    
    const evaluation = evaluatePaiGowHand(hand5, hand2);
    
    if (evaluation.isValid) {
      const score = evaluation.hand5Rank * 10 + evaluation.hand2Rank;
      if (score > bestScore) {
        bestScore = score;
        bestArrangement = { hand5, hand2 };
      }
    }
  }
  
  // Si no se encontró combinación válida, usar estrategia por defecto
  if (!bestArrangement) {
    // Intentar crear par en mano de 2 moviendo cartas
    for (let i = 0; i < sortedCards.length - 1; i++) {
      for (let j = i + 1; j < sortedCards.length; j++) {
        if (sortedCards[i].numeric === sortedCards[j].numeric) {
          const hand2 = [sortedCards[i], sortedCards[j]];
          const hand5 = sortedCards.filter((_, index) => index !== i && index !== j);
          const evaluation = evaluatePaiGowHand(hand5, hand2);
          if (evaluation.isValid) {
            return { hand5, hand2 };
          }
        }
      }
    }
    
    // Último recurso: primeras 5 y últimas 2
    return { hand5: sortedCards.slice(0, 5), hand2: sortedCards.slice(5, 7) };
  }
  
  return bestArrangement;
};

const generateCombinations = (cards) => {
  const combinations = [];
  const n = cards.length;
  
  // Combinación simple: tomar diferentes agrupaciones de 5 cartas
  for (let i = 0; i < Math.min(10, n - 4); i++) {
    const hand5 = [...cards.slice(0, i), ...cards.slice(i + 1, i + 5)];
    if (hand5.length === 5) {
      combinations.push(hand5);
    }
  }
  
  return combinations;
};

// Función para determinar si el jugador gana (probabilidad ajustable)
const shouldPlayerWin = (difficulty = "normal") => {
  const probabilities = {
    easy: 0.15,    // 15%
    normal: 0.05,  // 5%
    hard: 0.02     // 2%
  };
  
  return Math.random() < (probabilities[difficulty] || probabilities.normal);
};

// Función para generar mano ganadora forzada
const generateWinningHand = () => {
  // Crear una mano que garantice victoria (dos pares)
  return [
    { value: 'A', suit: '♥', numeric: 14 },
    { value: 'A', suit: '♠', numeric: 14 },
    { value: 'K', suit: '♥', numeric: 13 },
    { value: 'K', suit: '♠', numeric: 13 },
    { value: 'Q', suit: '♥', numeric: 12 },
    { value: 'J', suit: '♠', numeric: 11 },
    { value: '10', suit: '♥', numeric: 10 }
  ];
};

// Función para generar mano perdedora
const generateLosingHand = () => {
  // Crear una mano que probablemente pierda (sin pares fáciles)
  return [
    { value: 'A', suit: '♥', numeric: 14 },
    { value: 'K', suit: '♠', numeric: 13 },
    { value: 'Q', suit: '♦', numeric: 12 },
    { value: 'J', suit: '♣', numeric: 11 },
    { value: '9', suit: '♥', numeric: 9 },
    { value: '7', suit: '♠', numeric: 7 },
    { value: '5', suit: '♦', numeric: 5 }
  ];
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
  const { playSound, soundEnabled, toggleSound } = useGameSounds();

  const [bet, setBet] = useState(0);
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [arrangedHands, setArrangedHands] = useState({ hand5: [], hand2: [] });
  const [gameInProgress, setGameInProgress] = useState(false);
  const [dealingCards, setDealingCards] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false); // NUEVO ESTADO

  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  // MODIFICADO: Bloquear navegación con modal de imagen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameInProgress) {
          setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE ALERTA
          return true;
        }
        return false;
      }
    );

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE BLOQUEADOR
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, gameInProgress]);

  // MODIFICADO: Bloquear la barra de pestañas con modal de imagen
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: gameInProgress ? { display: 'none' } : {
        backgroundColor: "#1a1a1a",
        borderTopWidth: 2,
        borderTopColor: "#FFD700",
        paddingBottom: 8,
        paddingTop: 8,
        height: 65,
      }
    });

    if (gameInProgress) {
      const unsubscribe = navigation.getParent()?.addListener('tabPress', (e) => {
        e.preventDefault();
        setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE BLOQUEADOR
      });

      return () => {
        if (unsubscribe) unsubscribe();
        navigation.getParent()?.setOptions({
          tabBarStyle: {
            backgroundColor: "#1a1a1a",
            borderTopWidth: 2,
            borderTopColor: "#FFD700",
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          }
        });
      };
    }
  }, [navigation, gameInProgress]);

  // AÑADIR FUNCIÓN PARA CERRAR EL MODAL
  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
  };

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

  const triggerWinAnimation = (tickets) => {
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

    setGameInProgress(true);
    setDealingCards(true);

    await playSound("shuffle");

    setTimeout(async () => {
      // Determinar si el jugador ganará
      const playerWillWin = shouldPlayerWin("normal");
      
      let newCards;
      
      if (playerWillWin) {
        newCards = generateWinningHand();
      } else {
        // 80% de probabilidad de mano perdedora, 20% mano aleatoria
        newCards = Math.random() < 0.8 ? generateLosingHand() : Array(7).fill().map(() => dealCard());
      }
      
      setCards(newCards);
      setGameState("dealing");
      
      // El estado "dealing" será manejado por CardDealAnimation
    }, 1000);
  };

  const handleDealingComplete = async () => {
    setDealingCards(false);
    setGameState("arranging");
    setResult("");
    setTicketsWon(0);
    setArrangedHands({ hand5: [], hand2: [] });
    await playSound("card");
  };

  const handleAutoArrange = async () => {
    await playSound("click");
    pulseAnimation();
    
    const arrangement = autoArrangeCards(cards);
    setArrangedHands(arrangement);
    
    // Pequeña pausa antes de evaluar
    setTimeout(() => {
      evaluateHands(arrangement.hand5, arrangement.hand2);
    }, 800);
  };

  const evaluateHands = async (hand5, hand2) => {
    const evaluation = evaluatePaiGowHand(hand5, hand2);
    
    if (evaluation.isValid) {
      // JUGADOR GANA - solo dar tickets
      const ticketReward = getTicketRewards(bet, true);
      
      await addTickets(ticketReward, `Ganancia - Pai Gow Poker`);
      
      setResult(`¡Maneki acepta tu mano! +${ticketReward} Tickets`);
      setTicketsWon(ticketReward);
      await playSound("win");
      triggerWinAnimation(ticketReward);
    } else {
      // SI PIERDE - NO dar nada
      setResult("Maneki rechaza tu mano. No cumple las reglas");
      setTicketsWon(0);
      await playSound("lose");
      triggerLoseAnimation();
    }
    
    setGameState("result");
    setGameInProgress(false);
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
    setGameInProgress(false);
    setDealingCards(false);
    await playSound("click");
  };

  const renderCard = (card, index, isHighlighted = false) => {
    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <View key={index} style={[
        styles.card, 
        isHighlighted && styles.highlightedCard
      ]}>
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
      </View>
    );
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* AÑADIR MODAL DE BLOQUEO */}
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      {/* Animaciones */}
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} />

      {/* ELIMINAR BLOQUEADOR DE PESTAÑAS ORIGINAL */}

      {/* Indicador de juego en progreso */}
      {gameInProgress && (
        <View style={styles.gameInProgressIndicator}>
          <Text style={styles.gameInProgressText}>
            ⚠️ PARTIDA EN CURSO - NO PUEDES SALIR
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado */}
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

          {/* Botón de sonido */}
          <TouchableOpacity onPress={toggleSound} style={styles.soundButton}>
            <Ionicons 
              name={soundEnabled ? "volume-high" : "volume-mute"} 
              size={24} 
              color="#FFD700" 
            />
          </TouchableOpacity>
        </View>

        {/* Cartas repartidas con animación */}
        {cards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>TUS 7 CARTAS</Text>
              <Text style={styles.areaScore}>
                {gameState === "arranging" ? "ORGANIZAR" : 
                 gameState === "dealing" ? "REPARTIENDO..." : ""}
              </Text>
            </View>
            
            {dealingCards ? (
              <CardDealAnimation 
                cards={cards} 
                onComplete={handleDealingComplete}
              />
            ) : (
              <View style={styles.cardsContainer}>
                {cards.map((card, index) => renderCard(card, index))}
              </View>
            )}
          </View>
        )}

        {/* Manos organizadas */}
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
                      gameState === "arranging" ? "ORGANICE SUS CARTAS EN 2 MANOS" :
                      gameState === "dealing" ? "REPARTIENDO CARTAS..." : "")}
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
                Ambas manos deben tener al menos un par cada una
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
          <Text style={styles.rule}>• Ganas tickets si es válida</Text>
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
  soundButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#FFD700",
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
    gap: 5,
  },
  card: {
    width: 50,
    height: 70,
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
  highlightedCard: {
    borderColor: "#FFD700",
    borderWidth: 2,
    backgroundColor: "#FFF8E1",
    transform: [{ scale: 1.05 }],
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
  ticketsWonAnimation: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  // Estilos para el indicador de juego en progreso
  gameInProgressIndicator: {
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#B91C1C",
  },
  gameInProgressText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  // NUEVOS ESTILOS PARA EL MODAL TRANSPARENTE
  modalOverlayTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: "center",
    alignItems: "center",
  },
  blockModalContainerTransparent: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'transparent',
  },
  probabilityImageLarge: {
    width: width * 0.8,
    height: height * 0.6,
    maxWidth: 400,
    maxHeight: 400,
  },
});