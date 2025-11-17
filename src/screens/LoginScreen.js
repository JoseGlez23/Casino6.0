// src/screens/LoginScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  BackHandler,
} from "react-native";
import { Video } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../config/supabase";
import { signInWithBiometrics } from "../utils/biometrics";

const { width, height } = Dimensions.get("window");

// Dominios de email válidos
const dominiosValidos = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "protonmail.com",
  "aol.com",
  "live.com",
  "msn.com",
  "yandex.com",
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Prevenir retroceso en Android
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true; // Previene la acción por defecto (salir de la app)
      }
    );

    return () => backHandler.remove();
  }, []);

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return "Formato de email inválido";
    }

    const dominio = email.split("@")[1].toLowerCase();
    if (!dominiosValidos.includes(dominio)) {
      return `Dominio no válido. Usa: ${dominiosValidos.join(", ")}`;
    }

    return null;
  };

  const startSuccessAnimation = () => {
    // Animación de fade in y scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Esperar 1.5 segundos mostrando la animación y luego navegar
    setTimeout(() => {
      setLoginSuccess(false);
      navigation.navigate("Main");
    }, 1500);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return showAlert("Por favor ingresa tu email y contraseña.");
    }

    const errorEmail = validarEmail(email);
    if (errorEmail) {
      return showAlert(errorEmail);
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      // En lugar del alert, activamos la animación de éxito
      setLoginSuccess(true);
      startSuccessAnimation();
    } catch (e) {
      setLoading(false);
      showAlert(e.message);
    }
  };

  const handleBiometricLogin = async () => {
    const result = await signInWithBiometrics();
    if (result.ok) {
      setLoginSuccess(true);
      startSuccessAnimation();
    } else {
      showAlert(result.error);
    }
  };

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  return (
    <View style={styles.background}>
      <Video
        ref={videoRef}
        source={require("../assets/fondologin.mp4")}
        style={styles.videoBackground}
        resizeMode="cover"
        shouldPlay
        isLooping
        isMuted
      />

      {/* Overlay más claro para ver mejor el video */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado japonés con brillo - Reducido */}
          <View style={styles.headerContainer}>
            <View style={styles.titleGlow}>
              <Text style={styles.japaneseTitle}>招きカジノ</Text>
            </View>
            <View style={styles.subtitleGlow}>
              <Text style={styles.englishTitle}>MANEKI CASINO</Text>
            </View>
            <View style={styles.dividerGlow}>
              <View style={styles.divider} />
            </View>
          </View>

          {/* Logo principal más pequeño */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow}>
                <Image
                  source={require("../assets/logologin.png")}
                  style={styles.logo}
                />
              </View>
            </View>
          </View>

          {/* Formulario de login con mejor contraste */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputGlowContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#FF6B6B" />
                <TextInput
                  style={styles.input}
                  placeholder="Correo Electrónico"
                  placeholderTextColor="#DDD"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGlowContainer}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#FF6B6B"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#DDD"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons
                    name={showPass ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#FF6B6B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de inicio de sesión */}
            <TouchableOpacity
              style={styles.loginButtonGlow}
              onPress={handleLogin}
              disabled={loading || loginSuccess}
            >
              <View style={styles.loginButton}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : loginSuccess ? (
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Botón de huella digital */}
            <TouchableOpacity
              style={styles.biometricButtonGlow}
              onPress={handleBiometricLogin}
              disabled={loginSuccess}
            >
              <View style={styles.biometricButton}>
                <Ionicons name="finger-print" size={22} color="#FF6B6B" />
                <Text style={styles.biometricButtonText}>Huella Digital</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enlace a registro */}
          <View style={styles.footerContainer}>
            <View style={styles.registerGlow}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={loginSuccess}
              >
                <Text
                  style={[
                    styles.registerLink,
                    loginSuccess && styles.disabledLink,
                  ]}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay de éxito de login - Estilo Mejorado */}
      {loginSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successContainer}>
            {/* Header estilo HomeScreen */}
            <View style={styles.successHeader}>
              <View style={styles.successTitleContainer}>
                <Text style={styles.successJapaneseTitle}>招きカジノ</Text>
                <Text style={styles.successEnglishTitle}>MANEKI CASINO</Text>
              </View>
            </View>

            {/* Contenido principal */}
            <View style={styles.successContent}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#FFD700" />
              </View>
              <Text style={styles.successTitle}>
                ¡INICIO DE SESIÓN EXITOSO!
              </Text>
              <Text style={styles.successSubtitle}>
                Redirigiendo al casino...
              </Text>

              {/* Stats como en HomeScreen */}
              <View style={styles.successStats}>
                <View style={styles.successStatCard}>
                  <Ionicons name="diamond" size={24} color="#FFD700" />
                  <Text style={styles.successStatNumber}>BIENVENIDO</Text>
                  <Text style={styles.successStatLabel}>JUGADOR</Text>
                </View>
              </View>

              <ActivityIndicator
                size="large"
                color="#FFD700"
                style={styles.successSpinner}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Modal de alerta (solo para errores) */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Maneki Casino</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardAvoid: {
    flex: 1,
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    alignItems: "center",
    padding: 20,
    paddingTop: height * 0.05,
    minHeight: height,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  titleGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  japaneseTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF0000",
    fontFamily: Platform.OS === "ios" ? "Hiragino Mincho ProN" : "serif",
    textShadowColor: "#FF6B6B",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 6,
  },
  subtitleGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  englishTitle: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "300",
    letterSpacing: 3,
    marginBottom: 10,
  },
  dividerGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  divider: {
    width: 120,
    height: 2,
    backgroundColor: "#FF0000",
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoWrapper: {
    alignItems: "center",
  },
  logoGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#FF0000",
    backgroundColor: "rgba(26, 26, 26, 0.7)",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 0, 0, 0.5)",
    marginBottom: 20,
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  inputGlowContainer: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.6)",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 2,
    fontWeight: "500",
  },
  loginButtonGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  biometricButtonGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139, 0, 0, 0.1)",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  biometricButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  registerGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  registerLink: {
    color: "#FFD700",
    fontSize: 15,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  disabledLink: {
    opacity: 0.5,
  },
  // Estilos para el overlay de éxito - MEJORADO
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 15, 15, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: "#0F0F0F",
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 15,
  },
  successHeader: {
    backgroundColor: "#8B0000",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  successTitleContainer: {
    alignItems: "center",
  },
  successJapaneseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Hiragino Mincho ProN" : "serif",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  successEnglishTitle: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "300",
    letterSpacing: 2,
    marginTop: 2,
  },
  successContent: {
    padding: 30,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  successSubtitle: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    opacity: 0.8,
  },
  successStats: {
    flexDirection: "row",
    marginBottom: 25,
    width: "100%",
    justifyContent: "center",
  },
  successStatCard: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    minWidth: 150,
  },
  successStatNumber: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  successStatLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  successSpinner: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    padding: 25,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8B0000",
    alignItems: "center",
    maxWidth: width * 0.85,
  },
  modalTitle: {
    color: "#8B0000",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalMessage: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 10,
    paddingHorizontal: 35,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
