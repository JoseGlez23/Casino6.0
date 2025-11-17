// ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authenticateBiometric,
  saveBiometricEnabled,
  loadBiometricEnabled,
  saveRefreshToken,
  clearSavedRefreshToken,
} from "../utils/biometrics";
import { supabase } from "../config/supabase";
import { useCoins } from "../context/CoinsContext";
import * as Clipboard from "expo-clipboard";

export default function ProfileScreen({ navigation }) {
  const [fingerEnabled, setFingerEnabled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { manekiCoins, addCoins } = useCoins();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // BONO DIARIO (reinicia a medianoche)
  const [bonusAvailable, setBonusAvailable] = useState(true);
  const [bonusTimeText, setBonusTimeText] = useState("");

  // NUEVA FUNCIÓN: Copiar ID al portapapeles
  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(" ID Copiado", "El ID ha sido copiado al portapapeles", [
        { text: "Aceptar" },
      ]);
    } catch (error) {
      console.error("Error copiando al portapapeles:", error);
      Alert.alert(" Error", "No se pudo copiar el ID", [{ text: "Aceptar" }]);
    }
  };

  // Función para cargar datos del perfil
  const loadUserProfile = async () => {
    try {
      const enabled = await loadBiometricEnabled();
      setFingerEnabled(enabled);

      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("⚠ Error obteniendo perfil:", error);
        // Si hay error, intentar obtener datos básicos del usuario de auth
        if (authUser?.user) {
          setUserProfile({
            nombre_completo:
              authUser.user.user_metadata?.full_name || "Usuario",
            casino_id: authUser.user.id.slice(0, 8),
            email: authUser.user.email,
            fecha_creacion: authUser.user.created_at,
          });
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la fecha
  const formatMemberSince = () => {
    if (!userProfile) return "Fecha no disponible";

    // Intentar diferentes formatos de fecha
    let fecha;

    if (userProfile.fecha_creacion) {
      fecha = new Date(userProfile.fecha_creacion);
    } else if (userProfile.created_at) {
      fecha = new Date(userProfile.created_at);
    } else {
      return "Fecha no disponible";
    }

    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      return "Fecha no disponible";
    }

    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // === Bono diario: calculadora precisa hasta medianoche (horas, minutos, segundos) ===
  const updateTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // siguiente medianoche local
    const diff = midnight - now;
    if (diff <= 0) {
      setBonusAvailable(true);
      setBonusTimeText("🎁 ¡Bono disponible ahora!");
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const hText = hours === 1 ? "hora" : "horas";
    const mText = minutes === 1 ? "minuto" : "minutos";
    const sText = seconds === 1 ? "segundo" : "segundos";

    setBonusTimeText(
      `Disponible en ${hours} ${hText}, ${minutes} ${mText} y ${seconds} ${sText}`
    );
  };

  const checkBonusAvailability = async () => {
    try {
      const lastClaim = await AsyncStorage.getItem("lastBonusDay");
      const today = new Date().toDateString();
      if (!lastClaim || lastClaim !== today) {
        setBonusAvailable(true);
        setBonusTimeText(" ¡Bono disponible ahora!");
      } else {
        setBonusAvailable(false);
        updateTimeUntilMidnight();
      }
    } catch (e) {
      console.warn("Error al comprobar bono diario", e);
      setBonusAvailable(true);
      setBonusTimeText(" ¡Bono disponible ahora!");
    }
  };

  // Carga inicial + comprobación del bono cada segundo (para segundos en el contador)
  useEffect(() => {
    loadUserProfile();
    checkBonusAvailability();
    const interval = setInterval(() => {
      checkBonusAvailability();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
      checkBonusAvailability();
    }, [])
  );

  const showCustomAlert = (
    title,
    message,
    type = "info",
    onConfirm = null,
    twoButtons = false
  ) => {
    setModalData({
      title,
      message,
      type,
      onConfirm,
      twoButtons,
    });
    setModalVisible(true);
  };

  const activateFingerprint = async () => {
    const ok = await authenticateBiometric("Registrar Huella");
    if (!ok) return showCustomAlert("Error", "Huella no aceptada ❌", "error");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.refresh_token;

    await saveRefreshToken(token);
    await saveBiometricEnabled(true);
    setFingerEnabled(true);
    showCustomAlert("Hecho!", "Huella Activada", "success");
  };

  const disableFingerprint = async () => {
    await clearSavedRefreshToken();
    await saveBiometricEnabled(false);
    setFingerEnabled(false);
    showCustomAlert("Huella desactivada", "Se usará contraseña", "warning");
  };

  //  Reclamar bono diario (guardado por día, reinicio a medianoche)
  const handleDailyBonus = async () => {
    try {
      const today = new Date().toDateString();
      const lastClaim = await AsyncStorage.getItem("lastBonusDay");
      if (lastClaim === today) {
        return showCustomAlert(
          " Espera",
          "Ya reclamaste tu bono de hoy. Inténtalo mañana.",
          "warning"
        );
      }

      const bonusAmount = 1000;
      const newBalance = addCoins(bonusAmount, "Bono diario");

      // Guardar que reclamó hoy (se compara por toDateString para reinicio a medianoche)
      await AsyncStorage.setItem("lastBonusDay", today);

      setBonusAvailable(false);
      updateTimeUntilMidnight();

      showCustomAlert(
        "¡Bono Diario! ",
        `Has recibido ${bonusAmount.toLocaleString()} Maneki Coins.\n\nTu nuevo saldo es: ${newBalance.toLocaleString()} MC`,
        "success"
      );
    } catch (e) {
      console.error("Error en handleDailyBonus", e);
      showCustomAlert("Error", "No se pudo procesar el bono. Inténtalo más tarde.", "error");
    }
  };

  //  SOLO HUELLA DIGITAL - Eliminados INE y Escaneo Facial
  const verificationSteps = [
    {
      icon: "finger-print",
      title: "Huella Dactilar",
      description: fingerEnabled
        ? "Desactivar huella"
        : "Activar acceso por huella",
      completed: fingerEnabled,
      biometric: true,
    },
  ];

  const handleVerificationPress = (step) => {
    if (step.biometric) {
      return fingerEnabled ? disableFingerprint() : activateFingerprint();
    }
    showCustomAlert(
      "🚧 Próximamente",
      "Esta función estará disponible pronto "
    );
  };

  //  QUITADO: "Recargar Fichas" del menú
  //  AGREGADO: "Soporte" entre "Bono Diario" y "Cerrar Sesión"
  const menuOptions = [
    { icon: "person", title: "Editar Perfil", screen: "EditProfile" },
    { icon: "wallet", title: "Mi Cartera", screen: "Wallet" },
    { icon: "gift", title: "Bono Diario", screen: "DailyBonus" },
    { icon: "help-circle", title: "Soporte", screen: "Support" }, // ✅ NUEVA OPCIÓN AGREGADA
    { icon: "log-out", title: "Cerrar Sesión", screen: "Logout" },
  ];

  const handleMenuPress = (item) => {
    switch (item.screen) {
      case "Logout":
        showCustomAlert(
          "Cerrar Sesión",
          "¿Estás seguro de que quieres cerrar sesión?",
          "warning",
          () => navigation.replace("Login"),
          true
        );
        break;
      case "Wallet":
        navigation.navigate("Wallet");
        break;
      case "DailyBonus":
        handleDailyBonus();
        break;
      case "EditProfile":
        navigation.navigate("EditProfile");
        break;
      case "Support": //  NUEVO CASO PARA SOPORTE
        navigation.navigate("Soporte");
        break;
      default:
        showCustomAlert(
          " Próximamente",
          `${item.title} estará disponible pronto`
        );
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#8B0000",
        }}
      >
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const userName = userProfile?.nombre_completo ?? "Usuario";
  const casinoID = userProfile?.casino_id ?? "---";
  const userEmail = userProfile?.email ?? "";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* INFO PERFIL */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("../assets/logologin.png")}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.userName}>{userName}</Text>

          {/* ID COPIABLE - MEJORADO PARA UNA SOLA FILA */}
          <TouchableOpacity
            style={styles.idContainer}
            onPress={() => copyToClipboard(casinoID)}
          >
            <Text style={styles.idText} numberOfLines={1} ellipsizeMode="tail">
              ID: {casinoID}
            </Text>
            <Ionicons
              name="copy-outline"
              size={16}
              color="#FFD700"
              style={styles.copyIcon}
            />
          </TouchableOpacity>

          <Text style={styles.userEmail}>{userEmail}</Text>

          <View style={styles.verificationStatus}>
            <Ionicons
              name={fingerEnabled ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={fingerEnabled ? "#32CD32" : "#FFD700"}
            />
            <Text
              style={[
                styles.statusText,
                { color: fingerEnabled ? "#32CD32" : "#FFD700" },
              ]}
            >
              {fingerEnabled ? "Verificado " : "Pendiente "}
            </Text>
          </View>

          {/* Saldo Principal */}
          <View style={styles.mainBalance}>
            <Text style={styles.balanceLabel}>SALDO ACTUAL</Text>
            <Text style={styles.balanceAmount}>
              {manekiCoins.toLocaleString()} MC
            </Text>
            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.balanceButton}
                onPress={() => navigation.navigate("BuyCoinsScreen")}
              >
                <Ionicons name="add-circle" size={16} color="#000" />
                <Text style={styles.balanceButtonText}>RECARGAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.balanceButton, !bonusAvailable && { backgroundColor: "#555" }]}
                onPress={handleDailyBonus}
                disabled={!bonusAvailable}
              >
                <Ionicons name="gift" size={16} color="#000" />
                <Text style={styles.balanceButtonText}>BONO</Text>
              </TouchableOpacity>
            </View>

            {/* CONTADOR DE BONO - debajo del botón */}
            {!bonusAvailable ? (
              <Text style={styles.countdownText}>Próximo bono: {bonusTimeText}</Text>
            ) : (
              <Text style={styles.countdownTextReady}> ¡Bono disponible ahora!</Text>
            )}
          </View>
        </View>

        {/* VERIFICACIÓN - SOLO HUELLA DIGITAL */}
        <View style={styles.verificationSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verificación de Identidad</Text>
            <Text style={styles.progressText}>
              {verificationSteps.filter((s) => s.completed).length}/
              {verificationSteps.length} completados
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (verificationSteps.filter((s) => s.completed).length /
                      verificationSteps.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>

          {verificationSteps.map((step, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.verificationStep,
                step.completed && styles.verificationStepCompleted,
              ]}
              onPress={() => handleVerificationPress(step)}
            >
              <View style={styles.stepLeft}>
                <View
                  style={[
                    styles.stepIconContainer,
                    step.completed && styles.stepIconCompleted,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={20}
                    color={step.completed ? "#fff" : "#FFD700"}
                  />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={step.completed ? "#32CD32" : "#FFD700"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* MENÚ - CON NUEVA OPCIÓN DE SOPORTE */}
        <View style={styles.menuSection}>
          {menuOptions.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, item.screen === "DailyBonus" && !bonusAvailable && { opacity: 0.6 }]}
              onPress={() => handleMenuPress(item)}
              disabled={item.screen === "DailyBonus" && !bonusAvailable}
            >
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    item.screen === "DailyBonus" && styles.bonusIconContainer,
                    item.screen === "Support" && styles.supportIconContainer, //  NUEVO ESTILO PARA SOPORTE
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.screen === "DailyBonus"
                        ? "#000"
                        : item.screen === "Support"
                        ? "#000"
                        : "#FFD700" //  COLOR PARA SOPORTE
                    }
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>{item.title}</Text>
                  {item.screen === "DailyBonus" && (
                    <Text style={styles.menuSubtext}>+1,000 MC gratis</Text>
                  )}
                  {item.screen === "Support" && ( //  NUEVO SUBTEXTO PARA SOPORTE
                    <Text style={styles.menuSubtext}>Ayuda y asistencia</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFD700" />
            </TouchableOpacity>
          ))}
        </View>

        {/* INFORMACIÓN DEL USUARIO */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color="#FFD700" />
            <Text style={styles.infoText}>
              Miembro desde: {formatMemberSince()}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
            <Text style={styles.infoText}>Cuenta verificada</Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  modalData.type === "error"
                    ? "#8B0000"
                    : modalData.type === "warning"
                    ? "#8B7500"
                    : modalData.type === "success"
                    ? "#006400"
                    : "#800000",
                borderColor:
                  modalData.type === "error"
                    ? "#FF6B6B"
                    : modalData.type === "warning"
                    ? "#FFD700"
                    : modalData.type === "success"
                    ? "#32CD32"
                    : "#FFD700",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name={
                  modalData.type === "error"
                    ? "close-circle"
                    : modalData.type === "warning"
                    ? "warning"
                    : modalData.type === "success"
                    ? "checkmark-circle"
                    : "information-circle"
                }
                size={50}
                color="#FFD700"
              />
              <Text style={styles.modalTitle}>{modalData.title}</Text>
            </View>

            <Text style={styles.modalMessage}>{modalData.message}</Text>

            <View style={styles.modalButtonsContainer}>
              {(modalData.twoButtons ||
                modalData.type === "warning" ||
                modalData.type === "error") && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  modalData.type === "success"
                    ? styles.modalButtonSuccess
                    : modalData.type === "warning"
                    ? styles.modalButtonWarning
                    : modalData.type === "error"
                    ? styles.modalButtonError
                    : styles.modalButtonInfo,
                ]}
                onPress={() => {
                  setModalVisible(false);
                  if (modalData.onConfirm) {
                    modalData.onConfirm();
                  }
                }}
              >
                <Text style={styles.modalButtonText}>
                  {modalData.twoButtons
                    ? "Sí, Cerrar Sesión"
                    : modalData.type === "warning"
                    ? "Sí, Cancelar"
                    : "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#8B0000",
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#800000",
    margin: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  userName: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // ✅ CAMBIADO PARA MEJOR DISTRIBUCIÓN
    marginBottom: 8,
    paddingHorizontal: 15,
    paddingVertical: 10, // ✅ AUMENTADO PADDING VERTICAL
    backgroundColor: "#8B0000",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: "90%", // ✅ ANCHO CONTROLADO
    minHeight: 44, // ✅ ALTURA MÍNIMA PARA MEJOR TACTO
  },
  idText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    flex: 1, // ✅ OCUPA TODO EL ESPACIO DISPONIBLE
    marginRight: 8, // ✅ ESPACIO ENTRE TEXTO E ICONO
    textAlign: "center",
    includeFontPadding: false, // ✅ EVITA PADDING EXTRA
  },
  userEmail: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 12,
    width: "100%",
  },
  copyIcon: {
    // ✅ EL ICONO SE MANTIENE A LA DERECHA
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B0000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
    width: "80%",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    textAlign: "center",
  },
  mainBalance: {
    backgroundColor: "#8B0000",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  balanceLabel: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
  },
  balanceActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  balanceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    gap: 5,
  },
  balanceButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  verificationSection: {
    margin: 15,
    backgroundColor: "#800000",
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  progressText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#8B0000",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#32CD32",
    borderRadius: 4,
  },
  verificationStep: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#8B0000",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  verificationStepCompleted: {
    backgroundColor: "#228B22",
  },
  stepLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#800000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  stepIconCompleted: {
    backgroundColor: "#32CD32",
    borderColor: "#32CD32",
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  stepDescription: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },
  menuSection: {
    margin: 15,
    backgroundColor: "#800000",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#8B0000",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B0000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  bonusIconContainer: {
    backgroundColor: "#FFD700",
  },
  supportIconContainer: {
    // ✅ NUEVO ESTILO PARA ICONO DE SOPORTE
    backgroundColor: "#4169E1", // Azul real para soporte
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  menuSubtext: {
    color: "#FFD700",
    fontSize: 11,
    marginTop: 2,
  },
  infoSection: {
    margin: 15,
    backgroundColor: "#800000",
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  infoText: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
  },
  modalContainer: {
    width: "85%",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 10,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  modalMessage: {
    fontSize: 15,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: "500",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
    minWidth: 80,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#8B0000",
  },
  modalButtonSuccess: {
    backgroundColor: "#006400",
  },
  modalButtonWarning: {
    backgroundColor: "#8B7500",
  },
  modalButtonError: {
    backgroundColor: "#8B0000",
  },
  modalButtonInfo: {
    backgroundColor: "#800000",
  },
  modalButtonText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  countdownText: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  countdownTextReady: {
    color: "#32CD32",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "700",
    textAlign: "center",
  }
});
