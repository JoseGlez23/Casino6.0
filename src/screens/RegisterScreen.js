// src/screens/RegisterScreen.js
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
  Switch,
  ActivityIndicator,
} from "react-native";
import { Video } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../config/supabase";
import { generateCasinoID } from "../utils/generateCasinoID";

const { width, height } = Dimensions.get("window");

// Lista de países
const paises = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", 
  "Cuba", "República Dominicana", "Ecuador", "El Salvador", "Guatemala", 
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", 
  "Puerto Rico", "España", "Uruguay", "Venezuela", "Estados Unidos"
];

// Dominios de email válidos
const dominiosValidos = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'live.com', 'msn.com', 'yandex.com'
];

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [pais, setPais] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [terminosModalVisible, setTerminosModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  const calcularEdad = (fecha) => {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
    return edad;
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return "Formato de email inválido";
    }
    
    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosValidos.includes(dominio)) {
      return `Dominio no válido. Usa: ${dominiosValidos.join(', ')}`;
    }
    
    return null;
  };

  const handleRegister = async () => {
    if (!nombre || !pais || !email || !password || !confirmPassword) {
      return showAlert("Por favor completa todos los campos.");
    }

    const errorEmail = validarEmail(email);
    if (errorEmail) {
      return showAlert(errorEmail);
    }

    if (password !== confirmPassword) {
      return showAlert("Las contraseñas no coinciden.");
    }

    if (password.length < 6) {
      return showAlert("La contraseña debe tener al menos 6 caracteres.");
    }

    if (!terminos) {
      return showAlert("Debes aceptar los términos y condiciones.");
    }

    if (calcularEdad(fechaNacimiento) < 18) {
      return showAlert("Debes ser mayor de 18 años para registrarte.");
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("No se obtuvo ID de usuario.");

      const casinoID = generateCasinoID();

      const { error: insertError } = await supabase
        .from("usuarios")
        .insert({
          id: userId,
          nombre_completo: nombre,
          fecha_nacimiento: fechaNacimiento.toISOString().split("T")[0],
          pais_residencia: pais,
          email,
          acepta_terminos: true,
          casino_id: casinoID,
        });

      if (insertError) {
        const msg = insertError.message || "";
        if (msg.includes("duplicate") || msg.includes("unique")) {
          throw new Error("Ese correo o nombre ya está en uso");
        }
        throw new Error("Error guardando datos: " + msg);
      }

      showAlert(" Cuenta creada exitosamente\nRevisa tu correo y confirma antes de iniciar sesión.");

    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  const onChangeFecha = (event, selectedDate) => {
    setMostrarPicker(false);
    if (selectedDate) setFechaNacimiento(selectedDate);
  };

  const TerminosModal = () => (
    <Modal transparent visible={terminosModalVisible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.terminosModalContainer}>
          <Text style={styles.terminosTitle}>Términos y Condiciones</Text>
          
          <ScrollView style={styles.terminosContent}>
            <Text style={styles.terminosSectionTitle}>1. Aceptación de Términos</Text>
            <Text style={styles.terminosText}>
              Al registrarte en Maneki Casino, aceptas cumplir con estos términos y condiciones. Debes ser mayor de 18 años para utilizar nuestros servicios.
            </Text>

            <Text style={styles.terminosSectionTitle}>2. Cuenta de Usuario</Text>
            <Text style={styles.terminosText}>
              • Debes proporcionar información veraz y actualizada{'\n'}
              • Eres responsable de mantener la confidencialidad de tu cuenta{'\n'}
              • Notifica inmediatamente cualquier uso no autorizado{'\n'}
              • Una cuenta por persona está permitida
            </Text>

            <Text style={styles.terminosSectionTitle}>3. Juego Responsable</Text>
            <Text style={styles.terminosText}>
              • Establece límites de tiempo y dinero{'\n'}
              • El juego es una forma de entretenimiento, no una fuente de ingresos{'\n'}
              • Si crees que tienes un problema con el juego, busca ayuda profesional{'\n'}
              • Ofrecemos herramientas de autoexclusión y límites
            </Text>

            <Text style={styles.terminosSectionTitle}>4. Transacciones</Text>
            <Text style={styles.terminosText}>
              • Todas las transacciones están sujetas a verificación{'\n'}
              • Nos reservamos el derecho de rechazar cualquier transacción{'\n'}
              • Los fondos deben provenir de fuentes legítimas{'\n'}
              • Los retiros están sujetos a procesos de verificación
            </Text>

            <Text style={styles.terminosSectionTitle}>5. Privacidad</Text>
            <Text style={styles.terminosText}>
              Protegemos tu información personal según nuestra Política de Privacidad. Tus datos no serán compartidos con terceros sin tu consentimiento, excepto cuando lo requiera la ley.
            </Text>

            <Text style={styles.terminosSectionTitle}>6. Propiedad Intelectual</Text>
            <Text style={styles.terminosText}>
              Todo el contenido del casino, incluyendo logos, diseños y software, es propiedad de Maneki Casino y está protegido por derechos de autor.
            </Text>

            <Text style={styles.terminosSectionTitle}>7. Limitación de Responsabilidad</Text>
            <Text style={styles.terminosText}>
              Maneki Casino no se hace responsable por pérdidas derivadas del uso de nuestros servicios. Juegas bajo tu propio riesgo.
            </Text>

            <Text style={styles.terminosSectionTitle}>8. Modificaciones</Text>
            <Text style={styles.terminosText}>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios.
            </Text>
          </ScrollView>

          <View style={styles.terminosButtons}>
            <TouchableOpacity 
              style={styles.terminosCancelButton}
              onPress={() => setTerminosModalVisible(false)}
            >
              <Text style={styles.terminosCancelText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.terminosAcceptButton}
              onPress={() => {
                setTerminos(true);
                setTerminosModalVisible(false);
              }}
            >
              <Text style={styles.terminosAcceptText}>Aceptar Términos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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

      <View style={styles.overlay} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          
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

          {/* Eliminado el "Bienvenido" y cambiado a título más compacto */}
          <View style={styles.welcomeGlow}>
            <Text style={styles.subtitle}>Crear Cuenta</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Nombre */}
            <View style={styles.inputGlowContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#FF6B6B" />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#DDD"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>
            </View>

            {/* Fecha */}
            <View style={styles.inputGlowContainer}>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setMostrarPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#FF6B6B" />
                <TextInput
                  style={styles.input}
                  placeholder="Fecha de nacimiento"
                  placeholderTextColor="#DDD"
                  value={fechaNacimiento.toISOString().split("T")[0]}
                  editable={false}
                />
              </TouchableOpacity>
            </View>

            {mostrarPicker && (
              <DateTimePicker
                value={fechaNacimiento}
                mode="date"
                display="default"
                onChange={onChangeFecha}
                maximumDate={new Date()}
              />
            )}

            {/* País con Picker */}
            <View style={styles.inputGlowContainer}>
              <View style={styles.pickerContainer}>
                <Ionicons name="earth-outline" size={20} color="#FF6B6B" style={styles.pickerIcon} />
                <Picker
                  selectedValue={pais}
                  onValueChange={setPais}
                  style={styles.picker}
                  dropdownIconColor="#FF6B6B"
                >
                  <Picker.Item label="Selecciona tu país" value="" />
                  {paises.map((paisItem) => (
                    <Picker.Item key={paisItem} label={paisItem} value={paisItem} />
                  ))}
                </Picker>
              </View>
            </View>

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
                <Ionicons name="lock-closed-outline" size={20} color="#FF6B6B" />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (mín. 6 caracteres)"
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

            {/* Confirmar */}
            <View style={styles.inputGlowContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#FF6B6B" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#DDD"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#FF6B6B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Términos */}
            <View style={styles.switchContainer}>
              <Switch 
                value={terminos} 
                onValueChange={setTerminos} 
                thumbColor={terminos ? "#FF6B6B" : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#8B0000" }}
              />
              <TouchableOpacity 
                style={styles.terminosLink}
                onPress={() => setTerminosModalVisible(true)}
              >
                <Text style={styles.switchText}>
                  Acepto los <Text style={styles.terminosLinkText}>términos y condiciones</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón */}
            <TouchableOpacity
              style={styles.registerButtonGlow}
              onPress={handleRegister}
              disabled={loading}
            >
              <View style={styles.registerButton}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Enlace a login */}
          <View style={styles.footerContainer}>
            <View style={styles.loginGlow}>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>
                  ¿Ya tienes cuenta? Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TerminosModal />

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

const styles = StyleSheet.create({
  background: { 
    flex: 1,
    backgroundColor: "#000000"
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
    paddingTop: height * 0.03, // 3% de la altura para más espacio
    minHeight: height,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
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
    fontFamily: Platform.OS === 'ios' ? 'Hiragino Mincho ProN' : 'serif',
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
  welcomeGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20, // Reducido
  },
  subtitle: {
    color: "#FFD700",
    fontSize: 20, // Reducido
    fontWeight: "300",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    borderRadius: 16,
    padding: 20, // Reducido
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
    marginBottom: 15, // Reducido
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.6)",
    paddingHorizontal: 15,
    paddingVertical: 12, // Reducido
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 2,
    fontWeight: "500",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.6)",
    paddingHorizontal: 15,
  },
  pickerIcon: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    color: "#FFF",
    height: 45, // Reducido
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20, // Reducido
    marginTop: 8, // Reducido
    paddingHorizontal: 5,
  },
  terminosLink: {
    flex: 1,
  },
  switchText: {
    color: "#FFD700",
    marginLeft: 10, // Reducido
    fontSize: 13, // Reducido
    fontWeight: "500",
  },
  terminosLinkText: {
    color: "#FF6B6B",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  registerButtonGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12, // Reducido
  },
  registerButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14, // Reducido
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16, // Reducido
    letterSpacing: 1,
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 15, // Reducido
  },
  loginGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  loginLink: {
    color: "#FFD700",
    fontSize: 15, // Reducido
    textDecorationLine: "underline",
    fontWeight: "500",
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
  // Estilos para el modal de términos
  terminosModalContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    padding: 20, // Reducido
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8B0000",
    maxWidth: width * 0.9,
    maxHeight: "80%",
  },
  terminosTitle: {
    color: "#FF0000",
    fontSize: 22, // Reducido
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15, // Reducido
  },
  terminosContent: {
    marginBottom: 15, // Reducido
  },
  terminosSectionTitle: {
    color: "#FFD700",
    fontSize: 15, // Reducido
    fontWeight: "bold",
    marginTop: 12, // Reducido
    marginBottom: 6, // Reducido
  },
  terminosText: {
    color: "#fff",
    fontSize: 13, // Reducido
    lineHeight: 18, // Reducido
    marginBottom: 8, // Reducido
  },
  terminosButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8, // Reducido
  },
  terminosCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#8B0000",
    paddingVertical: 10, // Reducido
    paddingHorizontal: 20, // Reducido
    borderRadius: 8,
    flex: 1,
    marginRight: 8, // Reducido
    alignItems: "center",
  },
  terminosCancelText: {
    color: "#8B0000",
    fontWeight: "bold",
    fontSize: 15, // Reducido
  },
  terminosAcceptButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 10, // Reducido
    paddingHorizontal: 20, // Reducido
    borderRadius: 8,
    flex: 1,
    marginLeft: 8, // Reducido
    alignItems: "center",
  },
  terminosAcceptText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15, // Reducido
  },
});