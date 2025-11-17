// src/games/cards/Baccarat.js
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
  Alert, Image,
  BackHandler,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";

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
    outputRange: [0, -10, 8, -8, 6, -6, 4, -4, 2, -2, 0],
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
      <Text style={styles.loseText}>PERDISTE</Text>
    </Animated.View>
  );
};

// Componente de animación de victoria
const WinAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

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
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
      <Animated.View
        style={{
          transform: [{ rotate: rotateInterpolation }],
        }}
      >
        <Ionicons name="trophy" size={60} color="#FFD700" />
      </Animated.View>
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

// Componente de carta profesional con animaciones corregidas
const Card = ({ card, index, type, cardAnim }) => {
  const getCardColor = (suit) => {
    return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
  };

  const cardAnimation = {
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.1, 1],
        }),
      },
      {
        rotate: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-180deg', '0deg'],
        }),
      },
    ],
    opacity: cardAnim,
  };

  return (
    <Animated.View style={[styles.card, cardAnimation]}>
      <View style={styles.cardInner}>
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
    </Animated.View>
  );
};

// Tabla de premios de tickets para Baccarat - MISMOS VALORES QUE BLACKJACK
const getTicketRewards = (betAmount, betType, isWin = false) => {
  if (!isWin) return 0;

  // Mismos valores que Blackjack
  const rewards = {
    100: { player: 150, banker: 150, tie: 250 },
    250: { player: 375, banker: 375, tie: 625 },
    500: { player: 750, banker: 750, tie: 1250 },
    1000: { player: 1500, banker: 1500, tie: 2500 },
  };
  return rewards[betAmount]?.[betType] || 0;
};

export default function Baccarat({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const [bet, setBet] = useState(0);
  const [betType, setBetType] = useState("");
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [cardDealAnims] = useState([]);
  
  // Estados CORREGIDOS: ahora es racha de victorias
  const [winStreak, setWinStreak] = useState(0);
  const [showLuckBoost, setShowLuckBoost] = useState(false);

  // NUEVOS ESTADOS para controlar la navegación
  const [gameInProgress, setGameInProgress] = useState(false);
  const [showTabBlocker, setShowTabBlocker] = useState(false);

  const resultAnimations = useRef(new Animated.Value(0)).current;
  const [pulseAnim] = useState(new Animated.Value(1));
  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // Inicializar animaciones para cada carta
  useEffect(() => {
    cardDealAnims.length = 0;
    for (let i = 0; i < 6; i++) {
      cardDealAnims.push(new Animated.Value(0));
    }
  }, []);

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

  // Manejar navegación y botón de retroceso - CORREGIDO para incluir "dealing"
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameState === "dealing" || gameInProgress) {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === "dealing" || gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState, gameInProgress]);

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

  // Función para determinar si el jugador gana automáticamente (5% de probabilidad)
  const shouldAutoWin = () => {
    return Math.random() < 0.05;
  };

  // Función CORREGIDA para calcular puntuación
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

  // Función CORREGIDA para animar cartas
  const animateCardDeal = (cardIndex, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(cardDealAnims[cardIndex], {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.spring(cardDealAnims[cardIndex], {
            toValue: 1,
            tension: 150,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      }, delay);
    });
  };

  const animateCards = async () => {
    // Resetear animaciones
    cardDealAnims.forEach(anim => anim.setValue(0));
    
    // Animar cartas en secuencia
    await animateCardDeal(0, 200);  // Player carta 1
    await animateCardDeal(1, 200);  // Banker carta 1  
    await animateCardDeal(2, 200);  // Player carta 2
    await animateCardDeal(3, 200);  // Banker carta 2
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

  const placeBet = async (amount, type) => {
    if (!canAfford(amount)) {
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

    setBet(amount);
    setBetType(type);
    subtractCoins(amount, `Apuesta en Baccarat - ${type}`);
    setGameState("dealing");
    setResult("");
    setTicketsWon(0);

    pulseAnimation();
    await animateCards();

    setTimeout(async () => {
      const autoWin = shouldAutoWin();
      let newPlayerCards, newBankerCards;

      if (autoWin) {
        // Victoria automática - generar cartas que aseguren la victoria según la apuesta
        if (type === "player") {
          newPlayerCards = [{ value: "9", suit: "♥" }, { value: "8", suit: "♦" }];
          newBankerCards = [{ value: "2", suit: "♠" }, { value: "3", suit: "♣" }];
        } else if (type === "banker") {
          newPlayerCards = [{ value: "2", suit: "♠" }, { value: "3", suit: "♣" }];
          newBankerCards = [{ value: "9", suit: "♥" }, { value: "8", suit: "♦" }];
        } else { // tie
          newPlayerCards = [{ value: "8", suit: "♥" }, { value: "K", suit: "♦" }];
          newBankerCards = [{ value: "8", suit: "♠" }, { value: "Q", suit: "♣" }];
        }
      } else {
        // Juego normal
        newPlayerCards = [dealCard(), dealCard()];
        newBankerCards = [dealCard(), dealCard()];
      }

      setPlayerCards(newPlayerCards);
      setBankerCards(newBankerCards);

      const initialPlayerScore = calculateScore(newPlayerCards);
      const initialBankerScore = calculateScore(newBankerCards);

      setPlayerScore(initialPlayerScore);
      setBankerScore(initialBankerScore);

      let playerThirdCard = null;
      let bankerThirdCard = null;

      // Animación de tercera carta del jugador
      if (initialPlayerScore <= 5 && !autoWin) {
        await new Promise(resolve => setTimeout(resolve, 800));
        playerThirdCard = dealCard();
        newPlayerCards.push(playerThirdCard);
        setPlayerCards([...newPlayerCards]);
        setPlayerScore(calculateScore(newPlayerCards));
        await animateCardDeal(4, 100); // Tercera carta player
      }

      // Animación de tercera carta del banquero
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentPlayerScore = calculateScore(newPlayerCards);

      if (!autoWin) {
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
      }

      if (bankerThirdCard) {
        await animateCardDeal(5, 100); // Tercera carta banker
      }

      setBankerCards([...newBankerCards]);
      setBankerScore(calculateScore(newBankerCards));

      // Resultado final
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const finalPlayerScore = calculateScore(newPlayerCards);
      const finalBankerScore = calculateScore(newBankerCards);

      let winner = "";
      if (finalPlayerScore > finalBankerScore) winner = "player";
      else if (finalBankerScore > finalPlayerScore) winner = "banker";
      else winner = "tie";

      let isWin = false;
      if (autoWin || winner === type) {
        isWin = true;
        // AUMENTAR racha de victorias
        setWinStreak(prev => prev + 1);
      } else {
        // RESET racha de victorias al perder
        setWinStreak(0);
      }

      // SOLO GANAS TICKETS, NO MANEKI COINS
      if (isWin) {
        const ticketReward = getTicketRewards(amount, type, true);
        if (ticketReward > 0) {
          await addTickets(ticketReward, `Ganancia en Baccarat - ${type}`);
          setTicketsWon(ticketReward);
        }

        if (autoWin) {
          setResult(`${winner.toUpperCase()} GANA - ¡GANANCIA SORPRESA! 🎉`);
        } else {
          setResult(`${winner.toUpperCase()} GANA - ¡GANASTE TICKETS!`);
        }
        triggerWinAnimation();

        // Verificar si debemos mostrar el boost de suerte después de una VICTORIA
        setTimeout(() => {
          checkAndShowLuckBoost();
        }, 1500);
      } else {
        setResult(`${winner.toUpperCase()} GANA - Mejor suerte la próxima`);
        triggerLoseAnimation();
      }

      setGameState("result");
      setGameInProgress(false); // Terminar el estado de juego en progreso
      animateResult();
      pulseAnimation();
    }, 500);
  };

  const resetGame = () => {
    setBet(0);
    setBetType("");
    setPlayerCards([]);
    setBankerCards([]);
    setGameState("betting");
    setResult("");
    setPlayerScore(0);
    setBankerScore(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setGameInProgress(false); // Asegurar que se reinicie el estado
    // NO resetear la racha de victorias aquí
    cardDealAnims.forEach(anim => anim.setValue(0));
  };

  const renderCard = (card, index, type) => {
    const animIndex = type === 'player' ? index : index + 2;
    const cardAnim = cardDealAnims[animIndex] || new Animated.Value(0);

    return (
      <Card
        key={index}
        card={card}
        index={index}
        type={type}
        cardAnim={cardAnim}
      />
    );
  };

  const betAmounts = [100, 250, 500, 1000];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
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


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Compacto */}
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

        {/* Área de apuestas compacta */}
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
                  onPress={() => {
                    if (canAfford(amount)) {
                      setBet(amount);
                      pulseAnimation();
                    }
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

            <Animated.View
              style={[
                styles.currentBetContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.currentBet}>
                {bet > 0
                  ? `Apuesta: ${bet.toLocaleString()} MC`
                  : "Seleccione un monto"}
              </Text>
            </Animated.View>

            <View style={styles.betOptions}>
              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.playerBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={() => bet > 0 && placeBet(bet, "player")}
                disabled={bet === 0}
              >
                <Ionicons name="person" size={20} color="#FFF" />
                <Text style={styles.betOptionText}>JUGADOR</Text>
                <Text style={styles.betOdds}>Paga 1:1</Text>
                <Text style={styles.ticketRewardSmall}>
                  +{getTicketRewards(bet, "player", true)} Tickets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.bankerBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={() => bet > 0 && placeBet(bet, "banker")}
                disabled={bet === 0}
              >
                <Ionicons name="business" size={20} color="#FFF" />
                <Text style={styles.betOptionText}>BANCO</Text>
                <Text style={styles.betOdds}>Paga 0.95:1</Text>
                <Text style={styles.ticketRewardSmall}>
                  +{getTicketRewards(bet, "banker", true)} Tickets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.betOption,
                  styles.tieBet,
                  bet === 0 && styles.disabledBet,
                ]}
                onPress={() => bet > 0 && placeBet(bet, "tie")}
                disabled={bet === 0}
              >
                <Ionicons name="swap-horizontal" size={20} color="#FFF" />
                <Text style={styles.betOptionText}>EMPATE</Text>
                <Text style={styles.betOdds}>Paga 8:1</Text>
                <Text style={styles.ticketRewardSmall}>
                  +{getTicketRewards(bet, "tie", true)} Tickets
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Área del juego compacta pero con cartas grandes */}
        {(gameState === "dealing" || gameState === "result") && (
          <View style={styles.gameArea}>
            <View style={styles.cardArea}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaTitle}>JUGADOR</Text>
                <Animated.View
                  style={[
                    styles.scoreContainer,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Text style={styles.areaScore}>{playerScore}</Text>
                </Animated.View>
              </View>
              <View style={styles.cardsContainer}>
                {playerCards.map((card, index) => 
                  renderCard(card, index, 'player')
                )}
              </View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.cardArea}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaTitle}>BANCO</Text>
                <Animated.View
                  style={[
                    styles.scoreContainer,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Text style={styles.areaScore}>{bankerScore}</Text>
                </Animated.View>
              </View>
              <View style={styles.cardsContainer}>
                {bankerCards.map((card, index) => 
                  renderCard(card, index, 'banker')
                )}
              </View>
            </View>
          </View>
        )}

        {/* Mensaje de resultado compacto */}
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
          </Animated.View>
        )}

        {/* Mostrar mensaje cuando se están repartiendo cartas */}
        {gameState === "dealing" && (
          <View style={styles.dealingContainer}>
            <Text style={styles.dealingText}>REPARTIENDO CARTAS...</Text>
          </View>
        )}

        {/* Botones de acción compactos */}
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  balances: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 6,
    minWidth: 80,
  },
  balanceIcon: {
    width: 20,
    height: 20,
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
  betContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  betTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    letterSpacing: 0.5,
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
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
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
    fontWeight: "600",
  },
  currentBetContainer: {
    marginBottom: 15,
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.4)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  betOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 6,
  },
  betOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
    fontSize: 12,
    textAlign: "center",
  },
  betOdds: {
    color: "#FFF",
    fontSize: 10,
    opacity: 0.9,
    fontWeight: "600",
  },
  ticketRewardSmall: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  gameArea: {
    marginBottom: 15,
  },
  cardArea: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  scoreContainer: {
    backgroundColor: "rgba(139, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    minHeight: 90,
    gap: 6,
  },
  vsContainer: {
    alignItems: "center",
    marginVertical: 4,
  },
  vsText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  card: {
    width: 60,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
    overflow: 'hidden',
  },
  cardInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    top: 4,
    left: 4,
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
    marginVertical: 12,
    padding: 12,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
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
  ticketsWonContainer: {
    marginTop: 6,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Nuevo estilo para el estado "dealing"
  dealingContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginVertical: 12,
  },
  dealingText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  controls: {
    alignItems: "center",
    marginTop: 10,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
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
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 16,
    borderRadius: 12,
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
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
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
  bottomSpacer: {
    height: 10,
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