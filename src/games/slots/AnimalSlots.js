// src/games/slots/AnimalSlots.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";

const { width, height } = Dimensions.get("window");

// Símbolos del juego con configuración profesional
const symbols = [
  {
    id: "lion",
    name: "León",
    multiplier: 25,
    image: require("../../assets/lion.png"),
    color: "#FFD700",
    rarity: "legendario",
    probability: 0.04,
    glowColor: "rgba(255, 215, 0, 0.8)"
  },
  {
    id: "tiger",
    name: "Tigre",
    multiplier: 18,
    image: require("../../assets/tiger.png"),
    color: "#FF6B35",
    rarity: "épico",
    probability: 0.07,
    glowColor: "rgba(255, 107, 53, 0.8)"
  },
  {
    id: "elephant",
    name: "Elefante",
    multiplier: 12,
    image: require("../../assets/elephant.png"),
    color: "#8B4513",
    rarity: "raro",
    probability: 0.12,
    glowColor: "rgba(139, 69, 19, 0.8)"
  },
  {
    id: "panda",
    name: "Panda",
    multiplier: 8,
    image: require("../../assets/panda.png"),
    color: "#000000",
    rarity: "raro",
    probability: 0.15,
    glowColor: "rgba(100, 100, 100, 0.8)"
  },
  {
    id: "giraffe",
    name: "Jirafa",
    multiplier: 5,
    image: require("../../assets/giraffe.png"),
    color: "#FFA500",
    rarity: "común",
    probability: 0.27,
    glowColor: "rgba(255, 165, 0, 0.8)"
  },
  {
    id: "monkey",
    name: "Mono",
    multiplier: 3,
    image: require("../../assets/monkey.png"),
    color: "#A0522D",
    rarity: "común",
    probability: 0.35,
    glowColor: "rgba(160, 82, 45, 0.8)"
  },
];

// Función para generar símbolos ponderados
const generateWeightedSymbol = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const symbol of symbols) {
    cumulative += symbol.probability;
    if (rand <= cumulative) {
      return symbol;
    }
  }
  return symbols[symbols.length - 1];
};

// Componente de partículas de victoria
const WinParticle = ({ show, symbol }) => {
  const particles = Array(15).fill(0);
  const animations = useRef(particles.map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (show) {
      const anims = animations.map((anim, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        
        return Animated.parallel([
          Animated.timing(anim.x, {
            toValue: Math.cos(angle) * distance,
            duration: 1000 + Math.random() * 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: Math.sin(angle) * distance,
            duration: 1000 + Math.random() * 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 800,
              delay: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.spring(anim.scale, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 800,
              delay: 200,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.stagger(30, anims).start();
    } else {
      animations.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.opacity.setValue(0);
        anim.scale.setValue(0);
      });
    }
  }, [show]);

  if (!show) return null;

  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: symbol?.color || '#FFD700',
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { scale: anim.scale },
              ],
              opacity: anim.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Componente de carrete profesional mejorado
const Reel = ({ symbols, reelIndex, isSpinning, onStop, finalSymbols, spinDuration, turboMode, nearMiss }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const anticipationAnim = useRef(new Animated.Value(0)).current;
  const [displaySymbols, setDisplaySymbols] = useState([]);
  
  useEffect(() => {
    // Crear un strip largo de símbolos para el efecto de giro
    const symbolStrip = [];
    for (let i = 0; i < 20; i++) {
      symbolStrip.push(generateWeightedSymbol());
    }
    if (finalSymbols) {
      symbolStrip.push(...finalSymbols);
    }
    setDisplaySymbols(symbolStrip);
  }, [finalSymbols]);

  useEffect(() => {
    if (isSpinning) {
      startSpinning();
    }
  }, [isSpinning]);

  useEffect(() => {
    if (nearMiss && !isSpinning && reelIndex === 2) {
      // Efecto de anticipación cuando casi ganas
      Animated.sequence([
        Animated.timing(anticipationAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(anticipationAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [nearMiss, isSpinning]);

  const startSpinning = () => {
    spinAnim.setValue(0);
    
    const duration = turboMode ? spinDuration * 0.5 : spinDuration;
    const delay = turboMode ? reelIndex * 100 : reelIndex * 300;
    
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: duration + delay,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && onStop) {
        onStop(reelIndex);
      }
    });
  };

  const translateY = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(displaySymbols.length - 3) * 70],
  });

  const anticipationShake = anticipationAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 5, 0],
  });

  return (
    <View style={styles.reelContainer}>
      <View style={styles.reelWindow}>
        <Animated.View 
          style={[
            styles.reelStrip,
            { 
              transform: [
                { translateY },
                { translateX: anticipationShake }
              ],
            }
          ]}
        >
          {displaySymbols.map((symbol, index) => (
            <View key={`${index}-${symbol.id}`} style={styles.symbolContainer}>
              <Image source={symbol.image} style={styles.symbolImage} />
              {!isSpinning && index >= displaySymbols.length - 3 && (
                <View style={[styles.symbolGlow, { shadowColor: symbol.glowColor }]} />
              )}
            </View>
          ))}
        </Animated.View>
      </View>
      
      {/* Marco del carrete */}
      <View style={styles.reelFrame} />
      
      {/* Efectos de giro */}
      {isSpinning && (
        <>
          <View style={styles.reelBlurTop} />
          <View style={styles.reelBlurBottom} />
        </>
      )}
    </View>
  );
};

// Componente de líneas de pago animadas
const Paylines = ({ activeLines = [], winningCombinations = [] }) => {
  const pulseAnims = useRef(
    Array(5).fill(0).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (activeLines.length > 0) {
      const animations = activeLines.map((lineId) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnims[lineId], {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnims[lineId], {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        );
      });

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    }
  }, [activeLines]);

  const lines = [
    { id: 0, style: styles.paylineTop, name: "Superior" },
    { id: 1, style: styles.paylineMiddle, name: "Central" },
    { id: 2, style: styles.paylineBottom, name: "Inferior" },
    { id: 3, style: styles.paylineDiagonal1, name: "Diagonal ↘" },
    { id: 4, style: styles.paylineDiagonal2, name: "Diagonal ↗" },
  ];

  return (
    <>
      {lines.map(line => {
        const isWinning = activeLines.includes(line.id);
        const winInfo = winningCombinations.find(w => w.lineId === line.id);
        const opacity = isWinning ? pulseAnims[line.id] : new Animated.Value(0.3);
        
        return (
          <Animated.View
            key={line.id}
            style={[
              line.style,
              {
                backgroundColor: isWinning ? winInfo?.symbol.color : 'rgba(255,215,0,0.2)',
                opacity: isWinning ? opacity : 0.3,
                shadowColor: isWinning ? winInfo?.symbol.color : 'transparent',
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: isWinning ? 5 : 0,
              }
            ]}
          />
        );
      })}
    </>
  );
};

// Animación de victoria mejorada
const WinAnimation = ({ show, amount, symbol, combinations }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const coinFallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.timing(coinFallAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      coinFallAnim.setValue(0);
    }
  }, [show]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coinTranslateY = coinFallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  if (!show) return null;

  const isJackpot = amount > 1000;
  const isBigWin = amount > 500;

  return (
    <Animated.View
      style={[
        styles.winAnimationContainer,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: symbol?.color || '#FFD700',
          backgroundColor: isJackpot ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.95)',
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons 
          name={isJackpot ? "star" : "trophy"} 
          size={isJackpot ? 70 : 50} 
          color={symbol?.color || "#FFD700"} 
        />
      </Animated.View>
      
      <Text style={[
        styles.winAnimationTitle,
        isJackpot && styles.jackpotTitle
      ]}>
        {isJackpot ? "🎰 ¡JACKPOT! 🎰" : isBigWin ? "¡GRAN VICTORIA!" : "¡GANASTE!"}
      </Text>
      
      <Animated.View style={{ transform: [{ translateY: coinTranslateY }] }}>
        <Text style={[
          styles.winAnimationAmount,
          { color: symbol?.color || '#FFD700' }
        ]}>
          +{amount.toLocaleString()}
        </Text>
        <Text style={styles.winAnimationCurrency}>TICKETS</Text>
      </Animated.View>

      {symbol && (
        <View style={styles.winSymbolInfo}>
          <Image source={symbol.image} style={styles.winSymbolImage} />
          <Text style={[styles.winSymbolName, { color: symbol.color }]}>
            {symbol.name} x{symbol.multiplier}
          </Text>
        </View>
      )}

      {combinations && combinations.length > 1 && (
        <Text style={styles.multiLineText}>
          ¡{combinations.length} LÍNEAS GANADORAS!
        </Text>
      )}
    </Animated.View>
  );
};

// Componente de historial de giros
const SpinHistory = ({ history }) => {
  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>ÚLTIMOS GIROS</Text>
      <View style={styles.historyList}>
        {history.slice(-10).reverse().map((spin, index) => (
          <View 
            key={index} 
            style={[
              styles.historyItem,
              spin.isWin && styles.historyWinItem
            ]}
          >
            <Text style={[
              styles.historyAmount,
              spin.isWin && styles.historyWinAmount
            ]}>
              {spin.isWin ? '+' : '-'}{spin.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AnimalSlots({ navigation }) {
  const { manekiCoins, tickets, addTickets, subtractCoins, canAfford } = useCoins();

  // Estados del juego
  const [reels, setReels] = useState([
    [symbols[2], symbols[3], symbols[4]],
    [symbols[1], symbols[4], symbols[5]],
    [symbols[0], symbols[2], symbols[3]],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(50);
  const [lastWin, setLastWin] = useState(0);
  const [winningLines, setWinningLines] = useState([]);
  const [winningCombinations, setWinningCombinations] = useState([]);
  const [showWin, setShowWin] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [totalSpins, setTotalSpins] = useState(0);
  const [currentWinSymbol, setCurrentWinSymbol] = useState(null);
  const [spinDuration] = useState(2000);
  const [turboMode, setTurboMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(0);
  const [spinHistory, setSpinHistory] = useState([]);
  const [nearMiss, setNearMiss] = useState(false);
  const [totalWins, setTotalWins] = useState(0);
  const [totalWinAmount, setTotalWinAmount] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [maxWin, setMaxWin] = useState(0);

  const betAmounts = [25, 50, 100, 250, 500];
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const machineGlowAnim = useRef(new Animated.Value(0)).current;
  const jackpotGlowAnim = useRef(new Animated.Value(0)).current;

  // Animación continua del jackpot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(jackpotGlowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(jackpotGlowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // AutoPlay logic
  useEffect(() => {
    let autoPlayTimer;
    if (autoPlay && autoPlayCount > 0 && !spinning && canAfford(bet)) {
      autoPlayTimer = setTimeout(() => {
        spinReels();
        setAutoPlayCount(prev => prev - 1);
      }, turboMode ? 1000 : 2000);
    } else if (autoPlayCount === 0) {
      setAutoPlay(false);
    }

    return () => clearTimeout(autoPlayTimer);
  }, [autoPlay, autoPlayCount, spinning]);

  // Lógica de pago mejorada
  const calculateWin = (finalReels, betAmount) => {
    const paylines = [
      { positions: [[0,0], [1,0], [2,0]], id: 0, name: "Superior" },
      { positions: [[0,1], [1,1], [2,1]], id: 1, name: "Central" },
      { positions: [[0,2], [1,2], [2,2]], id: 2, name: "Inferior" },
      { positions: [[0,0], [1,1], [2,2]], id: 3, name: "Diagonal ↘" },
      { positions: [[0,2], [1,1], [2,0]], id: 4, name: "Diagonal ↗" },
    ];

    let totalWin = 0;
    const winningLines = [];
    const combinations = [];
    let hasNearMiss = false;

    paylines.forEach(payline => {
      const lineSymbols = payline.positions.map(([reel, row]) => finalReels[reel][row]);
      const firstSymbol = lineSymbols[0];
      
      // Verificar combinación ganadora
      if (lineSymbols.every(symbol => symbol.id === firstSymbol.id)) {
        const winAmount = betAmount * firstSymbol.multiplier;
        totalWin += winAmount;
        winningLines.push(payline.id);
        
        combinations.push({
          lineId: payline.id,
          symbol: firstSymbol,
          amount: winAmount,
          lineName: payline.name
        });
      } else if (lineSymbols[0].id === lineSymbols[1].id && lineSymbols[0].id !== lineSymbols[2].id) {
        // Detectar near miss (2 de 3 símbolos iguales)
        hasNearMiss = true;
      }
    });

    return {
      totalWin,
      winningLines,
      winningCombinations: combinations,
      isWin: totalWin > 0,
      nearMiss: hasNearMiss && totalWin === 0
    };
  };

  // Generar resultados aleatorios
  const generateRandomReels = () => {
    return Array(3).fill().map(() => 
      Array(3).fill().map(() => generateWeightedSymbol())
    );
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonPulseAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(buttonPulseAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateMachineGlow = (isWin = false) => {
    Animated.sequence([
      Animated.timing(machineGlowAnim, {
        toValue: isWin ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(machineGlowAnim, {
        toValue: 0,
        duration: isWin ? 1000 : 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spinReels = async () => {
    if (spinning || !canAfford(bet)) {
      if (!canAfford(bet)) {
        Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins");
        setAutoPlay(false);
      }
      return;
    }

    animateButton();
    animateMachineGlow();
    Vibration.vibrate([0, 50, 50, 50]);

    setSpinning(true);
    setWinningLines([]);
    setWinningCombinations([]);
    setShowWin(false);
    setShowParticles(false);
    setCurrentWinSymbol(null);
    setNearMiss(false);
    
    subtractCoins(bet, `Apuesta en Safari Slots`);
    setTotalSpins(prev => prev + 1);

    setTimeout(() => {
      const newReels = generateRandomReels();
      setReels(newReels);

      const duration = turboMode ? spinDuration * 0.5 : spinDuration;
      
      setTimeout(() => {
        const winResult = calculateWin(newReels, bet);
        
        setNearMiss(winResult.nearMiss);
        
        if (winResult.isWin) {
          setLastWin(winResult.totalWin);
          setWinningLines(winResult.winningLines);
          setWinningCombinations(winResult.winningCombinations);
          setCurrentWinSymbol(winResult.winningCombinations[0]?.symbol);
          setTotalWins(prev => prev + 1);
          setTotalWinAmount(prev => prev + winResult.totalWin);
          setWinStreak(prev => prev + 1);
          
          if (winResult.totalWin > maxWin) {
            setMaxWin(winResult.totalWin);
          }
          
          setTimeout(() => {
            setShowWin(true);
            setShowParticles(true);
            addTickets(winResult.totalWin, `Ganancia en Safari Slots`);
            Vibration.vibrate([0, 100, 50, 100, 50, 200]);
            animateMachineGlow(true);
            
            setTimeout(() => {
              setShowWin(false);
              setShowParticles(false);
            }, 3000);
          }, 500);

          setSpinHistory(prev => [...prev, { amount: winResult.totalWin, isWin: true }]);
        } else {
          setWinStreak(0);
          setSpinHistory(prev => [...prev, { amount: bet, isWin: false }]);
          
          if (winResult.nearMiss) {
            Vibration.vibrate([0, 200]);
          }
        }
        
        setSpinning(false);
      }, duration + 900);
    }, 100);
  };

  const startAutoPlay = (spins) => {
    setAutoPlay(true);
    setAutoPlayCount(spins);
  };

  const stopAutoPlay = () => {
    setAutoPlay(false);
    setAutoPlayCount(0);
  };

  const getJackpotAmount = () => {
    return bet * symbols[0].multiplier * 2;
  };

  const jackpotOpacity = jackpotGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Premium */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.balanceSection}>
            <View style={styles.balanceItem}>
              <Image source={require("../../assets/dinero.png")} style={styles.coinIcon} />
              <Text style={styles.balanceText}>{manekiCoins.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Image source={require("../../assets/TICKET.png")} style={styles.ticketIcon} />
              <Text style={styles.balanceText}>{tickets.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => Alert.alert(
              "📊 Estadísticas",
              `Total de Giros: ${totalSpins}\n` +
              `Total Ganado: ${totalWinAmount} tickets\n` +
              `Victorias: ${totalWins}\n` +
              `% Victoria: ${totalSpins > 0 ? ((totalWins/totalSpins)*100).toFixed(1) : 0}%\n` +
              `Racha Actual: ${winStreak}\n` +
              `Mayor Ganancia: ${maxWin} tickets`
            )}
          >
            <Ionicons name="stats-chart" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Título del Juego */}
        <Animated.View style={[styles.titleSection, { opacity: jackpotOpacity }]}>
          <Text style={styles.gameTitle}>🎰 SAFARI SLOTS 🎰</Text>
          <Text style={styles.jackpotAmount}>
            JACKPOT: {getJackpotAmount().toLocaleString()} TICKETS
          </Text>
        </Animated.View>

        {/* Máquina Tragamonedas Premium */}
        <View style={styles.slotsMachine}>
          <Animated.View 
            style={[
              styles.machineGlow,
              { 
                opacity: machineGlowAnim,
                shadowColor: currentWinSymbol?.color || '#FF9800'
              }
            ]} 
          />
          
          <View style={styles.machineFrame}>
            {/* Header de la Máquina */}
            <View style={styles.machineHeader}>
              <View style={styles.machineHeaderContent}>
                <Ionicons name="trophy-outline" size={20} color="#000" />
                <Text style={styles.machineTitle}>SAFARI FORTUNE</Text>
                <Ionicons name="trophy-outline" size={20} color="#000" />
              </View>
            </View>

            {/* Área de Carretes */}
            <View style={styles.reelsArea}>
              <Paylines 
                activeLines={winningLines} 
                winningCombinations={winningCombinations}
              />
              
              <View style={styles.reelsContainer}>
                {reels.map((reel, index) => (
                  <Reel
                    key={index}
                    symbols={symbols}
                    reelIndex={index}
                    isSpinning={spinning}
                    onStop={() => {}}
                    finalSymbols={reel}
                    spinDuration={spinDuration}
                    turboMode={turboMode}
                    nearMiss={nearMiss}
                  />
                ))}
              </View>

              <View style={styles.glassOverlay} />
              
              {/* Indicadores de línea */}
              <View style={styles.lineIndicators}>
                <View style={styles.lineIndicatorLeft}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <View key={num} style={[
                      styles.lineNumber,
                      winningLines.includes(num - 1) && styles.lineNumberActive
                    ]}>
                      <Text style={styles.lineNumberText}>{num}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.lineIndicatorRight}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <View key={num} style={[
                      styles.lineNumber,
                      winningLines.includes(num - 1) && styles.lineNumberActive
                    ]}>
                      <Text style={styles.lineNumberText}>{num}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Panel de Información */}
            <View style={styles.infoPanel}>
              <View style={styles.infoPanelItem}>
                <Text style={styles.infoPanelLabel}>APUESTA</Text>
                <Text style={styles.infoPanelValue}>{bet}</Text>
              </View>
              <View style={styles.infoPanelDivider} />
              <View style={styles.infoPanelItem}>
                <Text style={styles.infoPanelLabel}>GANANCIA</Text>
                <Text style={[styles.infoPanelValue, styles.winValue]}>
                  {lastWin > 0 ? lastWin : '---'}
                </Text>
              </View>
              <View style={styles.infoPanelDivider} />
              <View style={styles.infoPanelItem}>
                <Text style={styles.infoPanelLabel}>LÍNEAS</Text>
                <Text style={styles.infoPanelValue}>{winningLines.length}/5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Animaciones de Victoria */}
        <WinAnimation 
          show={showWin} 
          amount={lastWin}
          symbol={currentWinSymbol}
          combinations={winningCombinations}
        />
        
        <WinParticle show={showParticles} symbol={currentWinSymbol} />

        {/* Panel de Control Premium */}
        <View style={styles.controlPanel}>
          
          {/* Modos de Juego */}
          <View style={styles.gameModesSection}>
            <TouchableOpacity
              style={[styles.gameModeButton, turboMode && styles.gameModeActive]}
              onPress={() => setTurboMode(!turboMode)}
            >
              <Ionicons name="flash" size={20} color={turboMode ? "#000" : "#FFD700"} />
              <Text style={[styles.gameModeText, turboMode && styles.gameModeTextActive]}>
                TURBO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameModeButton, autoPlay && styles.gameModeActive]}
              onPress={() => {
                if (autoPlay) {
                  stopAutoPlay();
                } else {
                  Alert.alert(
                    "Auto Play",
                    "¿Cuántos giros automáticos?",
                    [
                      { text: "10", onPress: () => startAutoPlay(10) },
                      { text: "25", onPress: () => startAutoPlay(25) },
                      { text: "50", onPress: () => startAutoPlay(50) },
                      { text: "100", onPress: () => startAutoPlay(100) },
                      { text: "Cancelar", style: "cancel" }
                    ]
                  );
                }
              }}
            >
              <Ionicons name="sync" size={20} color={autoPlay ? "#000" : "#FFD700"} />
              <Text style={[styles.gameModeText, autoPlay && styles.gameModeTextActive]}>
                AUTO {autoPlay ? `(${autoPlayCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Apuesta Premium */}
          <View style={styles.betSelector}>
            <Text style={styles.sectionTitle}>💰 SELECCIONAR APUESTA</Text>
            <View style={styles.betGrid}>
              {betAmounts.map(amount => {
                const canAffordBet = canAfford(amount);
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betButton,
                      bet === amount && styles.selectedBet,
                      (!canAffordBet || spinning) && styles.disabledBet
                    ]}
                    onPress={() => !spinning && setBet(amount)}
                    disabled={!canAffordBet || spinning}
                  >
                    <View style={styles.betButtonContent}>
                      <Text style={styles.betAmount}>{amount}</Text>
                      <Text style={styles.betLabel}>MC</Text>
                      <View style={styles.betMultiplierBadge}>
                        <Text style={styles.betMultiplierText}>
                          Max: {(amount * symbols[0].multiplier).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    {bet === amount && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botón de Giro Principal */}
          <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.spinButton,
                spinning && styles.spinningButton,
                !canAfford(bet) && styles.disabledSpin
              ]}
              onPress={spinReels}
              disabled={spinning || !canAfford(bet) || autoPlay}
            >
              <View style={styles.spinButtonGradient}>
                <View style={styles.spinButtonContent}>
                  {spinning ? (
                    <>
                      <Animated.View style={styles.spinningIcon}>
                        <Ionicons name="sync-circle" size={32} color="#FFF" />
                      </Animated.View>
                      <Text style={styles.spinButtonText}>GIRANDO...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={32} color="#FFF" />
                      <Text style={styles.spinButtonText}>
                        {autoPlay ? `AUTO (${autoPlayCount})` : 'GIRAR'}
                      </Text>
                    </>
                  )}
                  <View style={styles.spinCostBadge}>
                    <Text style={styles.spinCostText}>{bet} MC</Text>
                  </View>
                </View>
              </View>
              
              {!spinning && canAfford(bet) && (
                <View style={styles.spinButtonGlow} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Información de Racha */}
          {winStreak > 1 && (
            <View style={styles.streakBanner}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={styles.streakText}>
                ¡RACHA DE {winStreak} VICTORIAS! 🔥
              </Text>
              <Ionicons name="flame" size={24} color="#FF6B35" />
            </View>
          )}

          {/* Near Miss Indicator */}
          {nearMiss && !spinning && (
            <View style={styles.nearMissIndicator}>
              <Text style={styles.nearMissText}>
                ⚡ ¡Casi! Estuviste cerca de ganar
              </Text>
            </View>
          )}
        </View>

        {/* Historial de Giros */}
        {spinHistory.length > 0 && (
          <SpinHistory history={spinHistory} />
        )}

        {/* Tabla de Pagos Premium */}
        <View style={styles.payoutSection}>
          <Text style={styles.sectionTitle}>💎 TABLA DE PAGOS</Text>
          <Text style={styles.sectionSubtitle}>Multiplicadores por apuesta</Text>
          
          <View style={styles.payoutGrid}>
            {symbols.map((symbol, index) => (
              <View key={symbol.id} style={styles.payoutCard}>
                <View style={styles.payoutRank}>
                  <Text style={styles.payoutRankText}>#{index + 1}</Text>
                </View>
                <View style={[styles.symbolBadge, { borderColor: symbol.color }]}>
                  <Image source={symbol.image} style={styles.payoutSymbolImage} />
                  <View style={[styles.rarityIndicator, { backgroundColor: symbol.color }]}>
                    <Text style={styles.rarityText}>
                      {symbol.rarity.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.symbolName}>{symbol.name}</Text>
                <View style={styles.payoutInfo}>
                  <Text style={[styles.multiplierBig, { color: symbol.color }]}>
                    ×{symbol.multiplier}
                  </Text>
                  <Text style={styles.probabilityText}>
                    {(symbol.probability * 100).toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.maxWinText}>
                  Máx: {(bet * symbol.multiplier).toLocaleString()} tickets
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Información de Líneas de Pago */}
        <View style={styles.paylinesInfo}>
          <Text style={styles.sectionTitle}>📊 LÍNEAS DE PAGO ACTIVAS</Text>
          <View style={styles.paylinesGrid}>
            {[
              { id: 1, name: "Línea Superior", icon: "remove" },
              { id: 2, name: "Línea Central", icon: "remove" },
              { id: 3, name: "Línea Inferior", icon: "remove" },
              { id: 4, name: "Diagonal ↘", icon: "trending-down" },
              { id: 5, name: "Diagonal ↗", icon: "trending-up" },
            ].map(line => (
              <View key={line.id} style={styles.paylineInfoCard}>
                <View style={styles.paylineNumber}>
                  <Text style={styles.paylineNumberText}>{line.id}</Text>
                </View>
                <Ionicons name={line.icon} size={20} color="#FFD700" />
                <Text style={styles.paylineName}>{line.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reglas del Juego */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>📖 CÓMO JUGAR</Text>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Selecciona tu apuesta y presiona GIRAR
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                3 símbolos iguales en cualquier línea = Victoria
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                5 líneas de pago siempre activas
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Modo TURBO para giros más rápidos
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                AUTO PLAY para giros automáticos
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={[styles.ruleText, styles.jackpotRule]}>
                JACKPOT: {getJackpotAmount().toLocaleString()} tickets con León
              </Text>
            </View>
          </View>
        </View>

        {/* Footer con estadísticas */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            RTP: 96.5% | Volatilidad: Media-Alta
          </Text>
          <Text style={styles.footerSubtext}>
            Juega responsablemente 🎰
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 2,
    borderBottomColor: '#FF9800',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  balanceSection: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  coinIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  ticketIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  balanceText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statsButton: {
    padding: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  gameTitle: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#FF9800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  jackpotAmount: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Slot Machine Styles
  slotsMachine: {
    margin: 16,
    position: 'relative',
  },
  machineGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    backgroundColor: '#FF9800',
    borderRadius: 30,
    opacity: 0,
  },
  machineFrame: {
    backgroundColor: '#2D3748',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  machineHeader: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    alignItems: 'center',
  },
  machineHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  machineTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  
  // Reels Area
  reelsArea: {
    backgroundColor: '#1A202C',
    height: 220,
    position: 'relative',
    paddingVertical: 10,
  },
  reelsContainer: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: 15,
    gap: 10,
    justifyContent: 'center',
  },
  reelContainer: {
    flex: 1,
    maxWidth: 100,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FF9800',
  },
  reelWindow: {
    height: '100%',
    overflow: 'hidden',
  },
  reelStrip: {
    alignItems: 'center',
  },
  symbolContainer: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A202C',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  symbolImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  symbolGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  reelFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 8,
    pointerEvents: 'none',
  },
  reelBlurTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
  },
  reelBlurBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    pointerEvents: 'none',
  },

  // Line Indicators
  lineIndicators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    pointerEvents: 'none',
  },
  lineIndicatorLeft: {
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  lineIndicatorRight: {
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  lineNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lineNumberActive: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  lineNumberText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Paylines
  paylineTop: {
    position: 'absolute',
    top: '20%',
    left: 15,
    right: 15,
    height: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  paylineMiddle: {
    position: 'absolute',
    top: '50%',
    left: 15,
    right: 15,
    height: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  paylineBottom: {
    position: 'absolute',
    top: '80%',
    left: 15,
    right: 15,
    height: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  paylineDiagonal1: {
    position: 'absolute',
    top: '20%',
    left: 15,
    right: 15,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '13deg' }],
    zIndex: 10,
  },
  paylineDiagonal2: {
    position: 'absolute',
    top: '20%',
    left: 15,
    right: 15,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '-13deg' }],
    zIndex: 10,
  },

  // Info Panel
  infoPanel: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoPanelItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoPanelLabel: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoPanelValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winValue: {
    color: '#4CAF50',
    textShadowColor: '#4CAF50',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  infoPanelDivider: {
    width: 2,
    height: 30,
    backgroundColor: '#FF9800',
  },

  // Win Animation
  winAnimationContainer: {
    position: 'absolute',
    top: '25%',
    left: '5%',
    right: '5%',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 25,
  },
  winAnimationTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  jackpotTitle: {
    fontSize: 26,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  winAnimationAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  winAnimationCurrency: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  winSymbolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  winSymbolImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  winSymbolName: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  multiLineText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },

  // Particles
  particlesContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },

  // Control Panel
  controlPanel: {
    padding: 16,
  },
  gameModesSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gameModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  gameModeActive: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  gameModeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameModeTextActive: {
    color: '#000',
  },

  // Bet Selector
  betSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.7,
  },
  betGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  betButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
  },
  selectedBet: {
    borderColor: '#FFD700',
    backgroundColor: '#3A3A00',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledBet: {
    opacity: 0.4,
  },
  betButtonContent: {
    alignItems: 'center',
  },
  betAmount: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  betLabel: {
    color: '#FFD700',
    fontSize: 10,
    opacity: 0.8,
  },
  betMultiplierBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  betMultiplierText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
  },

  // Spin Button
  spinButton: {
    backgroundColor: '#FF9800',
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  spinButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF9800',
  },
  spinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  spinningIcon: {
    transform: [{ rotate: '0deg' }],
  },
  spinButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  spinCostBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  spinCostText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spinButtonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    opacity: 0.3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  spinningButton: {
    opacity: 0.8,
  },
  disabledSpin: {
    opacity: 0.5,
  },

  // Streak Banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginBottom: 12,
    gap: 8,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Near Miss Indicator
  nearMissIndicator: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
    marginBottom: 12,
  },
  nearMissText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // History
  historyContainer: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  historyTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  historyItem: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  historyWinItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  historyAmount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyWinAmount: {
    color: '#4CAF50',
  },

  // Payout Section
  payoutSection: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  payoutGrid: {
    gap: 10,
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  payoutRank: {
    backgroundColor: '#FFD700',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payoutRankText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  symbolBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
    marginRight: 12,
  },
  payoutSymbolImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  rarityIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  rarityText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  symbolName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  payoutInfo: {
    alignItems: 'center',
    marginRight: 12,
  },
  multiplierBig: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  probabilityText: {
    color: '#FFD700',
    fontSize: 10,
    marginTop: 2,
  },
  maxWinText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Paylines Info
  paylinesInfo: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  paylinesGrid: {
    gap: 8,
  },
  paylineInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  paylineNumber: {
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paylineNumberText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paylineName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },

  // Rules Section
  rulesSection: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    color: '#FFF',
    fontSize: 12,
    flex: 1,
  },
  jackpotRule: {
    color: '#FFD700',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    marginTop: 10,
  },
  footerText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerSubtext: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
});