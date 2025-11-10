// src/games/table/WheelOfFortune.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Image,
  Modal,
  ScrollView,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path, G, Text as SvgText } from "react-native-svg";
import { useCoins } from "../../context/CoinsContext";
import { useSounds } from "../../hooks/useSounds";

const WHEEL_SECTIONS = [
  { label: "x2", value: 2, color: "#FF6B6B" },
  { label: "x1", value: 1, color: "#4ECDC4" },
  { label: "x3", value: 3, color: "#FFD700" },
  { label: "x0", value: 0, color: "#95E1D3" },
  { label: "x5", value: 5, color: "#FF9FF3" },
  { label: "x2", value: 2, color: "#F368E0" },
  { label: "x10", value: 10, color: "#FF9F43" },
  { label: "x1", value: 1, color: "#54A0FF" },
];

// Componente de animación de victoria
const WinAnimation = ({ show, onClose }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
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

      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Modal transparent={true} visible={show} animationType="fade">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.winAnimation,
            {
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="trophy" size={80} color="#FFD700" />
          <Text style={styles.winAnimationText}>¡GRAN PREMIO!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Componente de animación de derrota
const LoseAnimation = ({ show, onClose }) => {
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (show) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Modal transparent={true} visible={show} animationType="fade">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.loseAnimation,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="sad-outline" size={80} color="#EF4444" />
          <Text style={styles.loseAnimationText}>¡SIN PREMIO!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function WheelOfFortune({ navigation }) {
  const { manekiCoins, tickets, subtractCoins, addTickets, canAfford } =
    useCoins();

  const { playSound, getSoundDuration } = useSounds();
  const [bet, setBet] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [spinDuration, setSpinDuration] = useState(4000); // Duración por defecto

  const spinAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Obtener la duración del audio al cargar el componente
  useEffect(() => {
    const loadSoundDuration = async () => {
      try {
        const duration = await getSoundDuration("slots");
        if (duration && duration > 0) {
          console.log(`Duración del audio de slots: ${duration}ms`);
          setSpinDuration(duration);
        }
      } catch (error) {
        console.log("Usando duración por defecto para el giro:", spinDuration);
      }
    };

    loadSoundDuration();
  }, []);

  // Función para calcular tickets ganados - PREMIOS BALANCEADOS
  const getTicketRewards = (betAmount, sectionValue) => {
    if (sectionValue === 0) return 0;

    const baseTickets = Math.floor(betAmount * 0.1); // 10% de la apuesta
    const multiplierTickets = sectionValue * 3; // Bonus por multiplicador
    return Math.max(1, baseTickets + multiplierTickets);
  };

  const startPulseAnimation = () => {
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
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const spinWheel = async (betAmount) => {
    if (!canAfford(betAmount)) {
      playSound("error");
      Vibration.vibrate(100);
      return;
    }

    if (spinning) return;

    try {
      playSound("coin");
      await subtractCoins(betAmount, "Apuesta en Wheel of Fortune");
      setBet(betAmount);
      setSpinning(true);
      setResult("");
      setTicketsWon(0);

      // Calcular rotación final con lógica corregida
      const totalSections = WHEEL_SECTIONS.length;
      const sectionAngle = 360 / totalSections;

      // Elegir sección ganadora aleatoria
      const winningSection = Math.floor(Math.random() * totalSections);
      const winMultiplier = WHEEL_SECTIONS[winningSection].value;

      console.log(
        `Sección ganadora: ${winningSection} (${WHEEL_SECTIONS[winningSection].label})`
      );
      console.log(`Duración del giro: ${spinDuration}ms`);

      // Calcular el ángulo donde debe detenerse la rueda
      // El puntero está en la parte superior (0 grados), así que necesitamos que la sección ganadora
      // termine en la posición opuesta al puntero (180 grados)
      const targetAngle = 180; // El puntero está a 0°, queremos que la sección esté a 180°
      const winningSectionCenter =
        winningSection * sectionAngle + sectionAngle / 2;
      const rotationNeeded = (targetAngle - winningSectionCenter + 360) % 360;

      // Añadir vueltas completas para efecto dramático
      const fullRotations = 5;
      const finalRotation = fullRotations * 360 + rotationNeeded;

      console.log(`Rotación final calculada: ${finalRotation}°`);

      // Resetear la animación a 0 para cada giro nuevo
      spinAnimation.setValue(0);

      // Reproducir sonido de slots DURANTE TODO EL GIRO
      playSound("slots");

      // Animación con easing para efecto realista - USANDO LA DURACIÓN DEL AUDIO
      Animated.timing(spinAnimation, {
        toValue: finalRotation,
        duration: spinDuration, // USAR LA DURACIÓN DEL AUDIO
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(async () => {
        const calculatedTickets = getTicketRewards(betAmount, winMultiplier);
        setTicketsWon(calculatedTickets);

        if (winMultiplier > 0) {
          playSound("success");
          Vibration.vibrate([0, 300, 100, 300]);
          startPulseAnimation();

          if (winMultiplier >= 5) {
            setShowWinAnimation(true);
          }

          try {
            // SOLO AGREGAR TICKETS
            await addTickets(
              calculatedTickets,
              `Victoria en Wheel - Multiplicador x${winMultiplier}`
            );
          } catch (error) {
            console.error("Error actualizando tickets:", error);
          }

          setResult(`¡${WHEEL_SECTIONS[winningSection].label}!`);
        } else {
          playSound("error");
          setShowLoseAnimation(true);
          setResult("SIN PREMIO");
        }

        setSpinning(false);
      });
    } catch (error) {
      playSound("error");
      Vibration.vibrate(100);
      setSpinning(false);
    }
  };

  const resetGame = () => {
    setBet(0);
    setResult("");
    setTicketsWon(0);
    stopPulseAnimation();
    // Resetear la animación a 0 para permitir nuevos giros
    spinAnimation.setValue(0);
  };

  const spinRotation = spinAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const renderWheelSection = (section, index) => {
    const totalSections = WHEEL_SECTIONS.length;
    const startAngle = (index * 360) / totalSections;
    const endAngle = ((index + 1) * 360) / totalSections;

    // Convertir ángulos a radianes
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Radio del círculo
    const radius = 90;

    // Coordenadas del centro
    const centerX = 100;
    const centerY = 100;

    // Calcular puntos para el path
    const x1 = centerX + radius * Math.cos(startRad - Math.PI / 2);
    const y1 = centerY + radius * Math.sin(startRad - Math.PI / 2);
    const x2 = centerX + radius * Math.cos(endRad - Math.PI / 2);
    const y2 = centerY + radius * Math.sin(endRad - Math.PI / 2);

    // Bandera para arco grande (ángulo > 180°)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // Texto posición
    const textAngle = (startAngle + endAngle) / 2;
    const textRad = (textAngle * Math.PI) / 180;
    const textRadius = 60;
    const textX = centerX + textRadius * Math.cos(textRad - Math.PI / 2);
    const textY = centerY + textRadius * Math.sin(textRad - Math.PI / 2);

    return (
      <G key={index}>
        <Path
          d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={section.color}
          stroke="#000"
          strokeWidth="2"
        />
        <SvgText
          x={textX}
          y={textY}
          fill="#000"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {section.label}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animaciones */}
      <WinAnimation
        show={showWinAnimation}
        onClose={() => setShowWinAnimation(false)}
      />
      <LoseAnimation
        show={showLoseAnimation}
        onClose={() => setShowLoseAnimation(false)}
      />

      {/* Header Mejorado */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>

        <Text style={styles.title}></Text>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Image
              source={require("../../assets/dinero.png")}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{manekiCoins}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Image
              source={require("../../assets/TICKET.png")}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{tickets}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Rueda de la fortuna */}
        <View style={styles.wheelContainer}>
          <Animated.View
            style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}
          >
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r="95"
                fill="#2b2b2b"
                stroke="#FFD700"
                strokeWidth="3"
              />
              {WHEEL_SECTIONS.map((section, index) =>
                renderWheelSection(section, index)
              )}
              <Circle cx="100" cy="100" r="15" fill="#FFD700" />
            </Svg>
          </Animated.View>
          <View style={styles.pointer} />
        </View>

        {/* Resultados */}
        {(result || ticketsWon > 0) && (
          <Animated.View
            style={[
              styles.resultContainer,
              ticketsWon > 0 && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.result}>{result}</Text>
            {ticketsWon > 0 && (
              <>
                <Text style={styles.ticketsWon}>+{ticketsWon} TICKETS</Text>
                <Text style={styles.ticketsInfo}>¡Solo ganas tickets!</Text>
              </>
            )}
            {ticketsWon === 0 && bet > 0 && (
              <Text style={styles.noWinText}>Pierdes: {bet} Maneki Coins</Text>
            )}
          </Animated.View>
        )}

        {/* Controles */}
        <View style={styles.controls}>
          {!spinning && bet === 0 && (
            <View style={styles.betContainer}>
              <Text style={styles.betTitle}>SELECCIONA APUESTA</Text>
              <View style={styles.betButtons}>
                {[50, 100, 250, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betButton,
                      !canAfford(amount) && styles.disabledButton,
                    ]}
                    onPress={() => spinWheel(amount)}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betButtonText}>{amount}</Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, 2)} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.betInfo}>
                GANAS SOLO TICKETS - La rueda decide tu premio
              </Text>
            </View>
          )}

          {spinning && (
            <View style={styles.spinningContainer}>
              <Text style={styles.spinningText}> GIRANDO...</Text>
            </View>
          )}

          {!spinning && bet > 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>JUGAR OTRA VEZ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Secciones de la rueda */}
        <View style={styles.sectionsInfo}>
          <Text style={styles.sectionsTitle}>
            PREMISOS EN LA RUEDA (TICKETS):
          </Text>
          <View style={styles.sectionsGrid}>
            {WHEEL_SECTIONS.map((section, index) => (
              <View
                key={index}
                style={[styles.sectionItem, { backgroundColor: section.color }]}
              >
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <Text style={styles.sectionTickets}>
                  {section.value === 0
                    ? "0"
                    : `+${getTicketRewards(100, section.value)}`}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionsNote}>
            * Por cada 100 Maneki Coins de apuesta
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
    flex: 1,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 4,
  },
  balanceIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    marginRight: 4,
  },
  balanceValue: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  wheelContainer: {
    position: "relative",
    marginBottom: 30,
    alignItems: "center",
  },
  wheel: {
    width: 200,
    height: 200,
  },
  pointer: {
    position: "absolute",
    top: -15,
    left: "50%",
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFD700",
    zIndex: 10,
  },
  resultContainer: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#374151",
    minWidth: 250,
  },
  result: {
    color: "#FFD700",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  ticketsWon: {
    color: "#3B82F6",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ticketsInfo: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  noWinText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  controls: {
    alignItems: "center",
    marginBottom: 25,
    width: "100%",
  },
  betContainer: {
    alignItems: "center",
    width: "100%",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  betButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  betButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 6,
    minWidth: 70,
    borderWidth: 2,
    borderColor: "#B45309",
    alignItems: "center",
  },
  betButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  ticketRewardText: {
    color: "#3B82F6",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  disabledButton: {
    backgroundColor: "#374151",
    borderColor: "#6B7280",
  },
  betInfo: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  spinningContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  spinningText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#B91C1C",
  },
  resetButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  sectionsInfo: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    borderWidth: 2,
    borderColor: "#374151",
  },
  sectionsTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  sectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
  },
  sectionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    margin: 4,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  sectionLabel: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  sectionTickets: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionsNote: {
    color: "#9CA3AF",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  // Estilos para las animaciones
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  winAnimation: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#10B981",
  },
  loseAnimation: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#EF4444",
  },
  winAnimationText: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseAnimationText: {
    color: "#EF4444",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});
