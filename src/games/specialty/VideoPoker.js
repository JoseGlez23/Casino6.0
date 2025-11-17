// src/games/specialty/VideoPoker.js
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
        { key: "shuffle", file: require("../../assets/sounds/shuffle.mp3") },
        { key: "hold", file: require("../../assets/sounds/hold.mp3") },
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
        case "hold":
          soundKey = "hold";
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
      case "hold":
        Vibration.vibrate(25);
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
const WinAnimation = ({ show, handName, winAmount }) => {
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
      <Text style={styles.winText}>¡{handName}!</Text>
      <Animated.Text 
        style={[
          styles.winAmountText,
          { opacity: confettiAnim }
        ]}
      >
        +{winAmount} Tickets
      </Animated.Text>
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
      <Text style={styles.loseText}>SIN PREMIO</Text>
    </Animated.View>
  );
};

// Componente de animación de reparto de cartas
const CardDealAnimation = ({ cards, heldCards, onComplete }) => {
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
    <View style={styles.cardsRow}>
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
                outputRange: ['-5deg', '0deg'],
              }),
            }
          ],
          opacity: cardAnimation,
        };

        return (
          <View key={index} style={styles.cardContainer}>
            <Animated.View 
              style={[
                styles.card, 
                animatedStyle,
                heldCards.includes(index) && styles.heldCard
              ]}
            >
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
          </View>
        );
      })}
    </View>
  );
};

// Componente de animación de cambio de cartas
const CardDrawAnimation = ({ cards, heldCards, onComplete }) => {
  const [animatedCards, setAnimatedCards] = useState([]);

  useEffect(() => {
    if (cards.length === 0) return;

    // Inicializar animaciones para cada carta
    const cardAnimations = cards.map((_, index) => 
      heldCards.includes(index) ? new Animated.Value(1) : new Animated.Value(0)
    );
    setAnimatedCards(cardAnimations);

    // Animar solo las cartas no mantenidas
    const animations = cardAnimations.map((anim, index) => {
      if (heldCards.includes(index)) {
        return Animated.delay(0); // No animar cartas mantenidas
      }
      return Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            delay: 200,
            useNativeDriver: true,
          })
        ])
      ]);
    });

    Animated.stagger(80, animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [cards, heldCards]);

  if (cards.length === 0 || animatedCards.length === 0) return null;

  return (
    <View style={styles.cardsRow}>
      {cards.map((card, index) => {
        const cardAnimation = animatedCards[index];
        
        if (!cardAnimation) return null;

        const isHeld = heldCards.includes(index);
        
        const animatedStyle = {
          transform: [
            {
              scale: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: isHeld ? [1, 1] : [0.8, 1],
              }),
            }
          ],
          opacity: cardAnimation,
        };

        return (
          <View key={index} style={styles.cardContainer}>
            <Animated.View 
              style={[
                styles.card, 
                animatedStyle,
                isHeld && styles.heldCard
              ]}
            >
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
            {isHeld && (
              <View style={styles.holdIndicator}>
                <Text style={styles.holdText}>MANTENIDA</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

// Función auxiliar para color de cartas
const getCardColor = (suit) => {
  return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
};

// Función para calcular tickets según apuesta y multiplicador
const getTicketRewards = (betAmount, multiplier = 0) => {
  const baseRewards = {
    10: 10,
    25: 25,
    50: 50,
    100: 100,
  };
  
  const baseTickets = baseRewards[betAmount] || betAmount;
  return multiplier > 0 ? Math.floor(baseTickets * multiplier) : 0;
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
                  numericValues.includes(14) && numericValues.includes(13) && 
                  numericValues.includes(12) && numericValues.includes(11) && numericValues.includes(10);
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
    const highCards = ['J', 'Q', 'K', 'A'];
    if (highCards.includes(pairValue)) {
      return { rank: 2, name: 'PAREJA DE JOTAS O MEJOR', multiplier: 1 };
    }
  }

  return { rank: 1, name: 'SIN PREMIO', multiplier: 0 };
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
const generateWinningHand = (handType = "royal") => {
  switch (handType) {
    case "royal":
      return [
        { value: 'A', suit: '♥', held: false },
        { value: 'K', suit: '♥', held: false },
        { value: 'Q', suit: '♥', held: false },
        { value: 'J', suit: '♥', held: false },
        { value: '10', suit: '♥', held: false }
      ];
    case "flush":
      return [
        { value: 'A', suit: '♠', held: false },
        { value: 'K', suit: '♠', held: false },
        { value: '8', suit: '♠', held: false },
        { value: '5', suit: '♠', held: false },
        { value: '3', suit: '♠', held: false }
      ];
    case "pair":
      return [
        { value: 'A', suit: '♥', held: false },
        { value: 'A', suit: '♠', held: false },
        { value: '7', suit: '♦', held: false },
        { value: '4', suit: '♣', held: false },
        { value: '2', suit: '♥', held: false }
      ];
    default:
      return [
        { value: 'A', suit: '♥', held: false },
        { value: 'K', suit: '♥', held: false },
        { value: 'Q', suit: '♥', held: false },
        { value: 'J', suit: '♥', held: false },
        { value: '10', suit: '♥', held: false }
      ];
  }
};

// Función para generar mano perdedora
const generateLosingHand = () => {
  // Crear una mano que no tenga combinaciones ganadoras
  return [
        { value: '2', suit: '♥', held: false },
        { value: '5', suit: '♠', held: false },
        { value: '8', suit: '♦', held: false },
        { value: 'J', suit: '♣', held: false },
        { value: 'K', suit: '♥', held: false }
      ];
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
  const { playSound, soundEnabled, toggleSound } = useGameSounds();

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
  const [gameInProgress, setGameInProgress] = useState(false);
  const [dealingCards, setDealingCards] = useState(false);
  const [drawingCards, setDrawingCards] = useState(false);
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

  const triggerWinAnimation = (handName, tickets) => {
    setWinningHand(handName);
    setWinMultiplier(tickets);
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

    setGameInProgress(true);
    setDealingCards(true);

    await playSound("shuffle");

    setTimeout(() => {
      // Determinar si el jugador ganará
      const playerWillWin = shouldPlayerWin("normal");
      
      let newCards;
      
      if (playerWillWin) {
        // Forzar mano ganadora (diferentes tipos para variedad)
        const handTypes = ["royal", "flush", "pair"];
        const randomType = handTypes[Math.floor(Math.random() * handTypes.length)];
        newCards = generateWinningHand(randomType);
      } else {
        // Mano normal (95% de probabilidad de perder)
        newCards = generateLosingHand();
      }
      
      setCards(newCards);
      setHeldCards([]);
      setResult("REPARTIENDO CARTAS...");
    }, 500);
  };

  // Función cuando terminan de repartirse las cartas
  const handleDealComplete = () => {
    setDealingCards(false);
    setGameState("holding");
    setResult("SELECCIONA LAS CARTAS QUE QUIERES MANTENER");
  };

  const toggleHold = async (index) => {
    if (gameState !== "holding") return;
    
    await playSound("hold");
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
    
    setDrawingCards(true);
    setResult("DIBUJANDO NUEVAS CARTAS...");
  };

  // Función cuando terminan de dibujarse las cartas
  const handleDrawComplete = () => {
    setDrawingCards(false);
    
    const newCards = [...cards];
    
    for (let i = 0; i < 5; i++) {
      if (!heldCards.includes(i)) {
        const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        newCards[i] = { value, suit, held: false };
      }
    }
    
    setCards(newCards);
    evaluateHand(newCards);
    setGameState("result");
  };

  const evaluateHand = async (hand) => {
    const evaluation = evaluateVideoPokerHand(hand);
    
    // Calcular tickets ganados
    const ticketReward = getTicketRewards(bet, evaluation.multiplier);

    if (evaluation.multiplier > 0) {
      // JUGADOR GANA - dar tickets
      await addTickets(ticketReward, `Ganancia - ${evaluation.name}`);
      
      setResult(`${evaluation.name}! GANAS ${ticketReward} Tickets`);
      setTicketsWon(ticketReward);
      await playSound("win");
      triggerWinAnimation(evaluation.name, ticketReward);
    } else {
      // SI PIERDE - NO dar nada
      setResult("Sin premio. Mejor suerte la próxima");
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
    setHeldCards([]);
    setGameState("betting");
    setResult("");
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setWinningHand("");
    setWinMultiplier(0);
    setGameInProgress(false);
    setDealingCards(false);
    setDrawingCards(false);
    await playSound("click");
  };

  const renderCard = (card, index) => {
    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.cardContainer}
        onPress={() => toggleHold(index)}
        disabled={gameState !== "holding"}
      >
        <View style={[styles.card, heldCards.includes(index) && styles.heldCard]}>
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
      {/* AÑADIR MODAL DE BLOQUEO */}
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      {/* Animaciones */}
      <WinAnimation show={showWinAnimation} handName={winningHand} winAmount={ticketsWon} />
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

        {/* Cartas con animación */}
        <View style={styles.cardsArea}>
          {dealingCards ? (
            <CardDealAnimation 
              cards={cards} 
              heldCards={heldCards}
              onComplete={handleDealComplete}
            />
          ) : drawingCards ? (
            <CardDrawAnimation 
              cards={cards} 
              heldCards={heldCards}
              onComplete={handleDrawComplete}
            />
          ) : cards.length > 0 ? (
            <View style={styles.cardsRow}>
              {cards.map((card, index) => renderCard(card, index))}
            </View>
          ) : null}
          
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
            {result || (gameState === "betting" ? "SELECCIONE SU APUESTA" : "")}
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
                      +{getTicketRewards(amount, 1)} tickets
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
          <Text style={styles.payoutsTitle}>TABLA DE PREMIOS</Text>
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
            * Solo se otorgan tickets al ganar
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
  soundButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  cardsArea: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 180,
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
    color: "#10B981",
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
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