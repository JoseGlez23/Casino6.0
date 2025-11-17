// src/games/cards/RedDog.js
import React, { useState, useEffect, useRef } from "react";
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
  BackHandler,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Componente para bloquear la barra de navegación
const TabBlocker = ({ isVisible, onPress }) => {
  if (!isVisible) return null;

  return (
    <TouchableOpacity 
      style={styles.tabBlocker} 
      onPress={onPress}
      activeOpacity={1}
    >
      <View style={styles.tabBlockerContent}>
        <Ionicons name="warning" size={32} color="#FFD700" />
        <Text style={styles.tabBlockerText}>
          Partida en curso{"\n"}
          <Text style={styles.tabBlockerSubtext}>
            Termina el juego primero
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Modal de Bloqueo - Solo imagen grande con auto-cierre de 3 segundos
const BlockModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(-100));
  const modalRef = useRef(null);

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
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Resetear animaciones cuando no es visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(-100);
    }
  }, [visible]);

  const handleClose = () => {
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
  };

  const handleModalPress = () => {
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlayTransparent} 
        activeOpacity={1}
        onPress={handleModalPress}
      >
        <Animated.View 
          ref={modalRef}
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
      </TouchableOpacity>
    </Modal>
  );
};

// Hook de sonidos para Red Dog
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      console.log("🔊 Cargando sonidos para Red Dog...");

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
      <Ionicons name="trophy" size={60} color="#FFD700" />
      <Text style={styles.winText}>¡GANASTE!</Text>
    </Animated.View>
  );
};

// Componente de Suerte Aumentada - Solo imagen
const LuckBoostImage = ({ show, winStreak, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [show]);

  if (!show) return null;

  const getImageSource = () => {
    if (winStreak >= 8) {
      return require("../../assets/suertex50.png");
    } else if (winStreak >= 5) {
      return require("../../assets/suertex20.png");
    } else {
      return require("../../assets/suertex10.png");
    }
  };

  return (
    <Animated.View
      style={[
        styles.luckBoostImageContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Image 
        source={getImageSource()} 
        style={styles.luckBoostImageLarge}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

// Tabla de premios de tickets para Red Dog - VALORES CONSISTENTES
const getTicketRewards = (betAmount, multiplier, isWin = false) => {
  if (!isWin) return 0;

  // Mismos valores base que otros juegos para mantener consistencia
  const baseRewards = {
    50: { 1: 60, 2: 120, 4: 240, 5: 300 },
    100: { 1: 120, 2: 240, 4: 480, 5: 600 },
    250: { 1: 300, 2: 600, 4: 1200, 5: 1500 },
    500: { 1: 600, 2: 1200, 4: 2400, 5: 3000 },
  };
  return baseRewards[betAmount]?.[multiplier] || 0;
};

// Tabla de premios de Maneki Coins - VALORES CONSISTENTES
const getCoinRewards = (betAmount, multiplier, isWin = false) => {
  if (!isWin) return 0;

  const baseRewards = {
    50: { 1: 60, 2: 120, 4: 240, 5: 300 },
    100: { 1: 120, 2: 240, 4: 480, 5: 600 },
    250: { 1: 300, 2: 600, 4: 1200, 5: 1500 },
    500: { 1: 600, 2: 1200, 4: 2400, 5: 3000 },
  };
  return baseRewards[betAmount]?.[multiplier] || 0;
};

export default function RedDog({ navigation }) {
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
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [winAmount, setWinAmount] = useState(0);
  const [spreadInfo, setSpreadInfo] = useState(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [coinsWon, setCoinsWon] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Estados CORREGIDOS: ahora es racha de victorias
  const [winStreak, setWinStreak] = useState(0);
  const [showLuckBoost, setShowLuckBoost] = useState(false);

  // NUEVOS ESTADOS para controlar la navegación
  const [gameInProgress, setGameInProgress] = useState(false);
  const [showTabBlocker, setShowTabBlocker] = useState(false);

  const cardAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));
  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // EFECTO PARA BLOQUEAR LA BARRA INFERIOR - NUEVO
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
        setShowTabBlocker(true);
        setTimeout(() => setShowTabBlocker(false), 2000);
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

  // Manejar navegación y botón de retroceso - CORREGIDO
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameState === "dealing" || gameState === "playing" || gameInProgress) {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === "dealing" || gameState === "playing" || gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState, gameInProgress]);

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

  // Función para determinar si el jugador gana automáticamente (5% de probabilidad)
  const shouldAutoWin = () => {
    return Math.random() < 0.05;
  };

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

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
  };

  const handleHideLuckBoost = () => {
    setShowLuckBoost(false);
  };

  // Verificar y mostrar boost de suerte basado en racha de VICTORIAS
  const checkAndShowLuckBoost = () => {
    if (winStreak >= 3) {
      setShowLuckBoost(true);
    }
  };

  const calculateSpreadInfo = (card1, card2) => {
    const spread = Math.abs(card1.numeric - card2.numeric) - 1;

    if (spread === 0) {
      return {
        message: "¡CARTAS CONSECUTIVAS!",
        multiplier: 5,
        payout: "Ganas Tickets x5 + Coins x5",
        color: "#10B981",
      };
    } else if (spread === 1) {
      return {
        message: "SPREAD DE 1 CARTA",
        multiplier: 4,
        payout: "Ganas Tickets x4 + Coins x4",
        color: "#2563EB",
      };
    } else if (spread === 2) {
      return {
        message: "SPREAD DE 2 CARTAS",
        multiplier: 2,
        payout: "Ganas Tickets x2 + Coins x2",
        color: "#F59E0B",
      };
    } else if (spread >= 3) {
      return {
        message: `SPREAD DE ${spread} CARTAS`,
        multiplier: 1,
        payout: "Ganas Tickets + Coins",
        color: "#DC2626",
      };
    }
    return null;
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

    // Marcar que el juego está en progreso
    setGameInProgress(true);

    // Mostrar boost de suerte si hay racha de victorias
    if (winStreak >= 3) {
      setShowLuckBoost(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setBet(betAmount);
    subtractCoins(betAmount, `Apuesta en Red Dog`);
    await playSound("coin");
    pulseAnimation();
    animateCards();

    setGameState("dealing");
    setResult("");
    setTicketsWon(0);
    setCoinsWon(0);

    // Repartir dos cartas iniciales
    setTimeout(async () => {
      const card1 = dealCard();
      let card2 = dealCard();

      // Asegurar que las cartas sean diferentes
      while (card1.numeric === card2.numeric) {
        card2 = dealCard();
      }

      const newCards = [card1, card2];
      setCards(newCards);

      // Calcular información del spread
      const spreadData = calculateSpreadInfo(card1, card2);
      setSpreadInfo(spreadData);

      // Sonidos de cartas repartidas
      await playSound("card");
      setTimeout(async () => await playSound("card"), 200);

      setGameState("playing");
    }, 500);
  };

  const raiseBet = async (additionalBet) => {
    if (!canAfford(additionalBet)) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para aumentar la apuesta"
      );
      return;
    }

    await playSound("coin");
    const newBet = bet + additionalBet;
    setBet(newBet);
    subtractCoins(additionalBet, `Aumento de apuesta en Red Dog`);

    // Repartir tercera carta
    setTimeout(async () => {
      const autoWin = shouldAutoWin();
      let thirdCard;

      if (autoWin) {
        // Victoria automática - generar carta que asegure la victoria
        const [card1, card2] = cards;
        const minCard = Math.min(card1.numeric, card2.numeric);
        const maxCard = Math.max(card1.numeric, card2.numeric);
        
        // Generar una carta que esté entre las dos primeras
        const possibleValues = [];
        for (let i = minCard + 1; i < maxCard; i++) {
          possibleValues.push(i);
        }
        
        if (possibleValues.length > 0) {
          const winningValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
          // Convertir valor numérico a string
          const valueKeys = Object.keys(cardValues);
          const valueString = valueKeys.find(key => cardValues[key] === winningValue);
          const suit = suits[Math.floor(Math.random() * suits.length)];
          thirdCard = { value: valueString, suit, numeric: winningValue };
        } else {
          thirdCard = dealCard();
        }
      } else {
        thirdCard = dealCard();
      }

      const newCards = [...cards, thirdCard];
      setCards(newCards);

      await playSound("card");

      // Determinar resultado
      const [card1, card2, card3] = newCards;
      const spread = Math.abs(card1.numeric - card2.numeric) - 1;

      let resultMessage = "";
      let isWin = false;
      let ticketReward = 0;
      let coinReward = 0;
      let totalBetLost = newBet;

      if (
        autoWin || 
        (card3.numeric > Math.min(card1.numeric, card2.numeric) &&
        card3.numeric < Math.max(card1.numeric, card2.numeric))
      ) {
        // Ganó - La tercera carta está entre las dos primeras
        const multiplier = spreadInfo.multiplier;
        ticketReward = getTicketRewards(newBet, multiplier, true);
        coinReward = getCoinRewards(newBet, multiplier, true);

        if (ticketReward > 0) {
          await addTickets(
            ticketReward,
            `Ganancia en Red Dog - Multiplicador ${multiplier}x`
          );
          setTicketsWon(ticketReward);
        }

        if (coinReward > 0) {
          await addCoins(
            coinReward,
            `Ganancia en Red Dog - Multiplicador ${multiplier}x`
          );
          setCoinsWon(coinReward);
        }

        if (autoWin) {
          resultMessage = `¡GANANCIA SORPRESA! - ${spreadInfo.message}`;
        } else {
          resultMessage = `¡GANASTE! - ${spreadInfo.message}`;
        }
        
        await playSound("win");
        triggerWinAnimation();
        isWin = true;
        totalBetLost = 0; // No pierde la apuesta si gana
        // AUMENTAR racha de victorias
        setWinStreak(prev => prev + 1);
      } else if (
        card3.numeric === card1.numeric ||
        card3.numeric === card2.numeric
      ) {
        // Empate - Tercera carta igual a una de las primeras
        // El jugador recupera su apuesta
        await addCoins(newBet, `Empate - Recuperación de apuesta en Red Dog`);
        resultMessage = `EMPATE - Recuperas tu apuesta de ${newBet} MC`;
        await playSound("click");
        totalBetLost = 0; // Recupera la apuesta
        // En empate, mantener la racha actual
      } else {
        // Pierde - Tercera carta fuera del rango
        // Ya se restaron las coins al hacer la apuesta, no es necesario restar más
        resultMessage = "PIERDES - La carta está fuera del rango";
        await playSound("lose");
        triggerLoseAnimation();
        // totalBetLost ya tiene el valor de newBet (la apuesta total)
        // RESET racha de victorias al perder
        setWinStreak(0);
      }

      setResult(resultMessage);
      setGameState("result");
      setGameInProgress(false); // Terminar el estado de juego en progreso
      animateResult();
      pulseAnimation();

      // Verificar si debemos mostrar el boost de suerte después de una VICTORIA
      if (isWin) {
        setTimeout(() => {
          checkAndShowLuckBoost();
        }, 1500);
      }
    }, 300);
  };

  const resetGame = async () => {
    setBet(0);
    setCards([]);
    setGameState("betting");
    setResult("");
    setWinAmount(0);
    setSpreadInfo(null);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setCoinsWon(0);
    setGameInProgress(false); // Asegurar que se reinicie el estado
    // NO resetear la racha de victorias aquí
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

  const betAmounts = [50, 100, 250, 500];
  const raiseAmounts = [50, 100, 200];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animación de victoria */}
      <WinAnimation show={showWinAnimation} />

      {/* Animación de pérdida */}
      <LoseAnimation show={showLoseAnimation} />
      
      <BlockModal
        visible={showBlockModal}
        onClose={handleCloseBlockModal}
      />

      <LuckBoostImage 
        show={showLuckBoost} 
        winStreak={winStreak}
        onHide={handleHideLuckBoost}
      />

      {/* Bloqueador de pestañas */}
      <TabBlocker 
        isVisible={showTabBlocker} 
        onPress={() => setShowTabBlocker(false)}
      />

      {/* Indicador de juego en progreso */}
      {gameInProgress && (
        <View style={styles.gameInProgressIndicator}>
          <Ionicons name="lock-closed" size={16} color="#FFF" />
          <Text style={styles.gameInProgressText}>
            PARTIDA EN CURSO - NO PUEDES SALIR
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
            {/* Indicador de RACHA DE VICTORIAS */}
            {winStreak > 0 && (
              <View style={styles.streakIndicator}>
                <Ionicons name="trophy" size={14} color="#FFD700" />
                <Text style={styles.streakText}>Racha: {winStreak}</Text>
              </View>
            )}
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Área de cartas */}
        {cards.length > 0 && (
          <View style={styles.cardsArea}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>CARTAS EN JUEGO</Text>
              <Text style={styles.areaScore}>
                {cards.length === 2 ? "INICIAL" : "FINAL"}
              </Text>
            </View>
            <View style={styles.cardsContainer}>
              {cards.map((card, index) => renderCard(card, index))}
              {cards.length === 2 && gameState === "playing" && (
                <View style={styles.thirdCardPlaceholder}>
                  <Text style={styles.placeholderText}>?</Text>
                  <Text style={styles.placeholderSubtext}>3ª CARTA</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Información del Spread */}
        {spreadInfo && gameState === "playing" && (
          <View
            style={[styles.spreadContainer, { borderColor: spreadInfo.color }]}
          >
            <Text style={[styles.spreadMessage, { color: spreadInfo.color }]}>
              {spreadInfo.message}
            </Text>
            <Text style={styles.spreadPayout}>{spreadInfo.payout}</Text>
            <Text style={styles.spreadMultiplier}>
              Multiplicador: {spreadInfo.multiplier}x
            </Text>
          </View>
        )}

        {/* Mensaje de resultado */}
        {(result || ticketsWon > 0 || coinsWon > 0) && (
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
            <Text
              style={[
                styles.message,
                ticketsWon > 0 || coinsWon > 0
                  ? styles.winMessage
                  : result.includes("EMPATE")
                  ? styles.tieMessage
                  : styles.loseMessage,
              ]}
            >
              {result}
            </Text>

            {(ticketsWon > 0 || coinsWon > 0) && gameState === "result" && (
              <View style={styles.rewardsContainer}>
                {ticketsWon > 0 && (
                  <View style={styles.rewardItem}>
                    <Image
                      source={require("../../assets/TICKET.png")}
                      style={styles.rewardIcon}
                    />
                    <Text style={styles.ticketsWonText}>
                      +{ticketsWon} Tickets
                    </Text>
                  </View>
                )}
                {coinsWon > 0 && (
                  <View style={styles.rewardItem}>
                    <Image
                      source={require("../../assets/dinero.png")}
                      style={styles.rewardIcon}
                    />
                    <Text style={styles.coinsWonText}>+{coinsWon} MC</Text>
                  </View>
                )}
              </View>
            )}

            {bet > 0 && result.includes("PIERDES") && (
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
              <Text style={styles.betTitle}>SELECCIONE SU APUESTA INICIAL</Text>

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
                      {amount.toLocaleString()} MC
                    </Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, 1, true)} Tickets
                    </Text>
                    <Text style={styles.coinRewardText}>
                      +{getCoinRewards(amount, 1, true)} MC
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

          {gameState === "playing" && (
            <View style={styles.raiseContainer}>
              <Text style={styles.raiseTitle}>AUMENTAR APUESTA</Text>
              <Text style={styles.raiseSubtitle}>
                Actual: {bet.toLocaleString()} MC
              </Text>

              <View style={styles.raiseAmounts}>
                {raiseAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.raiseButton,
                      !canAfford(amount) && styles.disabledButton,
                    ]}
                    onPress={async () => raiseBet(amount)}
                    disabled={!canAfford(amount)}
                  >
                    <Ionicons name="add-circle" size={16} color="#FFF" />
                    <Text style={styles.raiseButtonText}>
                      +{amount.toLocaleString()}
                    </Text>
                    <Text style={styles.raiseButtonSubtext}>MC</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    alignItems: "center",
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
  streakIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.6)", // Verde para victorias
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 4,
  },
  streakText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 70,
  },
  cardsArea: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
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
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
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
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
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
  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardSuit: {
    fontSize: 20,
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
  thirdCardPlaceholder: {
    width: 55,
    height: 77,
    backgroundColor: "rgba(139, 0, 0, 0.7)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholderSubtext: {
    color: "#FFF",
    fontSize: 8,
    marginTop: 2,
    textAlign: "center",
  },
  spreadContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  spreadMessage: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  spreadPayout: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  spreadMultiplier: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 12,
    padding: 15,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.6,
    lineHeight: 18,
  },
  winMessage: {
    color: "#10B981",
    borderColor: "#10B981",
  },
  loseMessage: {
    color: "#EF4444",
    borderColor: "#EF4444",
  },
  tieMessage: {
    color: "#F59E0B",
    borderColor: "#F59E0B",
  },
  rewardsContainer: {
    marginTop: 8,
    alignItems: "center",
    gap: 6,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 6,
  },
  rewardIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
  },
  coinsWonText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  betLost: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  controls: {
    marginTop: 8,
    marginBottom: 20,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 0.8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 10,
    marginTop: 4,
  },
  coinRewardText: {
    color: "#FFD700",
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    letterSpacing: 0.6,
  },
  raiseContainer: {
    alignItems: "center",
  },
  raiseTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  raiseSubtitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 15,
  },
  raiseAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    gap: 8,
  },
  raiseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 4,
  },
  raiseButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  raiseButtonSubtext: {
    color: "#FFF",
    fontSize: 9,
    opacity: 0.8,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    letterSpacing: 0.6,
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
    marginLeft: -80,
    marginTop: -60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
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
  // Estilos para el modal transparente (solo imagen)
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
    width: width * 0.8,  // 80% del ancho de la pantalla
    height: height * 0.6, // 60% del alto de la pantalla
    maxWidth: 400,       // Máximo ancho
    maxHeight: 400,      // Máximo alto
  },
  // Estilos para el sistema de suerte aumentada (solo imagen)
  luckBoostImageContainer: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    zIndex: 1001,
    alignItems: "center",
    justifyContent: "center",
  },
  luckBoostImageLarge: {
    width: width * 0.7,  // 70% del ancho de la pantalla
    height: height * 0.5, // 50% del alto de la pantalla
    maxWidth: 350,       // Máximo ancho
    maxHeight: 300,      // Máximo alto
  },
  // NUEVOS ESTILOS para el bloqueo de navegación
  gameInProgressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#B91C1C",
    gap: 8,
  },
  gameInProgressText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabBlocker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  tabBlockerContent: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    maxWidth: '80%',
  },
  tabBlockerText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  tabBlockerSubtext: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#FFF',
  },
});