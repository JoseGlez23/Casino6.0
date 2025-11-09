import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../context/CoinsContext";
import { supabase } from "../config/supabase";
import * as Clipboard from "expo-clipboard";

export default function TransferScreen({ navigation }) {
  const { manekiCoins, transferCoins, isLoading, refreshCoins } = useCoins();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [formattedAmount, setFormattedAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [dailyTransferred, setDailyTransferred] = useState(0);
  const [showAllContactsModal, setShowAllContactsModal] = useState(false);
  const DAILY_LIMIT = 20000;

  useEffect(() => {
    loadRecentContacts();
    loadDailyTransferStats();
  }, []);

  const loadDailyTransferStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "transferencia_saliente")
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString());

      if (error) throw error;

      const totalTransferred =
        transactions?.reduce((sum, transaction) => {
          return sum + Math.abs(transaction.amount);
        }, 0) || 0;

      setDailyTransferred(totalTransferred);
    } catch (error) {
      console.error("Error cargando estadísticas diarias:", error);
    }
  };

  const formatAmount = (text) => {
    const numericText = text.replace(/[^\d]/g, "");

    if (numericText === "") {
      setAmount("");
      setFormattedAmount("");
      return;
    }

    const number = parseInt(numericText, 10);
    if (isNaN(number)) {
      setAmount("");
      setFormattedAmount("");
      return;
    }

    setAmount(number.toString());
    setFormattedAmount(number.toLocaleString());
  };

  const validateDailyLimit = (transferAmount) => {
    const remainingLimit = DAILY_LIMIT - dailyTransferred;
    if (transferAmount > remainingLimit) {
      Alert.alert(
        "Límite Diario Excedido",
        `Has transferido ${dailyTransferred.toLocaleString()} MC hoy.\n` +
          `Límite restante: ${remainingLimit.toLocaleString()} MC\n` +
          `Límite diario: ${DAILY_LIMIT.toLocaleString()} MC`,
        [{ text: "Entendido" }]
      );
      return false;
    }
    return true;
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("✅ ID Copiado", "El ID ha sido copiado al portapapeles", [
        { text: "Aceptar" },
      ]);
    } catch (error) {
      console.error("Error copiando al portapapeles:", error);
      Alert.alert("❌ Error", "No se pudo copiar el ID", [{ text: "Aceptar" }]);
    }
  };

  const loadRecentContacts = async () => {
    try {
      setLoadingContacts(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Obtener las últimas transacciones de transferencia
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("user_dest, created_at, type")
        .eq("user_id", user.id)
        .or("type.eq.transferencia_saliente,type.eq.transferencia_entrante")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const contactsMap = new Map();

      // Procesar cada transacción para obtener información real del usuario
      for (const transaction of transactions) {
        if (transaction.user_dest) {
          const userDest = transaction.user_dest;

          // NUEVO FORMATO: "Nombre Completo (casino_id - email)"
          const newFormatMatch = userDest.match(
            /(.+?)\s+\((.+?)\s+-\s+(.+?)\)/
          );

          let contactId = "";
          let contactEmail = "";
          let contactName = "";

          if (newFormatMatch) {
            // NUEVO FORMATO DETECTADO
            contactName = newFormatMatch[1].trim(); // Nombre completo
            contactId = newFormatMatch[2].trim(); // casino_id
            contactEmail = newFormatMatch[3].trim(); // email
          } else {
            // Formato antiguo: "casino_id (email)"
            const oldFormatMatch = userDest.match(/(.+?)\s+\((.+?)\)/);
            if (oldFormatMatch) {
              contactId = oldFormatMatch[1].trim();
              contactEmail = oldFormatMatch[2].trim();
              contactName = contactEmail.split("@")[0]; // Usar parte del email como nombre temporal
            } else {
              continue; // Saltar si no podemos parsear
            }
          }

          // CORREGIDO: Usar EMAIL como clave única para evitar duplicados
          const uniqueKey = contactEmail || contactId;

          if (uniqueKey && !contactsMap.has(uniqueKey)) {
            // Buscar información REAL del usuario en la base de datos
            let userInfo = null;

            // Buscar por email primero (más confiable)
            if (contactEmail) {
              const { data: userData, error: userError } = await supabase
                .from("usuarios")
                .select("nombre_completo, email, casino_id")
                .eq("email", contactEmail)
                .single();

              if (!userError && userData) {
                userInfo = userData;
              }
            }

            // Si no se encontró por email, buscar por casino_id
            if (!userInfo && contactId) {
              const { data: userData, error: userError } = await supabase
                .from("usuarios")
                .select("nombre_completo, email, casino_id")
                .eq("casino_id", contactId)
                .single();

              if (!userError && userData) {
                userInfo = userData;
              }
            }

            // Usar la información REAL del usuario de la base de datos
            const finalName = userInfo?.nombre_completo || contactName;
            const finalEmail = userInfo?.email || contactEmail;
            const finalId = userInfo?.casino_id || contactId;

            // Solo agregar si tenemos información válida
            if (finalEmail || finalId) {
              contactsMap.set(uniqueKey, {
                id: finalId,
                name: finalName,
                email: finalEmail,
                lastInteraction: transaction.created_at,
                type: transaction.type,
              });
            }
          }
        }
      }

      // Convertir a array y ordenar por fecha
      const contacts = Array.from(contactsMap.values()).sort(
        (a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction)
      );

      setRecentContacts(contacts);
    } catch (error) {
      console.error("Error cargando contactos:", error);
      setRecentContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };
  // CORREGIDA: Función de transferencia con soporte para mensaje
  const handleTransfer = async () => {
    const transferAmount = parseInt(amount);

    if (!recipient) {
      Alert.alert("Error", "Ingresa el email o ID de casino del destinatario.");
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      Alert.alert("Error", "Ingresa un monto válido.");
      return;
    }
    if (transferAmount < 10) {
      Alert.alert("Error", "El monto mínimo de transferencia es 10 monedas.");
      return;
    }
    if (transferAmount > manekiCoins) {
      Alert.alert("Error", "Fondos insuficientes.");
      return;
    }

    if (!validateDailyLimit(transferAmount)) {
      return;
    }

    Alert.alert(
      "Confirmar Transferencia",
      `¿Enviar ${transferAmount.toLocaleString()} monedas a ${recipient}?${
        message ? `\n\nMensaje: ${message}` : ""
      }\n\nLímite diario restante: ${(
        DAILY_LIMIT -
        dailyTransferred -
        transferAmount
      ).toLocaleString()} MC`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setIsProcessing(true);

              // CORREGIDO: Pasar el mensaje como cuarto parámetro
              const result = await transferCoins(
                transferAmount,
                recipient,
                "Transferencia", // descripción por defecto
                message || null // mensaje personalizado (puede ser null)
              );

              setDailyTransferred((prev) => prev + transferAmount);

              Alert.alert(
                "✅ Transferencia Exitosa",
                `Has transferido ${transferAmount.toLocaleString()} monedas a ${
                  result.recipientName
                }.\n\nTu nuevo saldo: ${result.newBalance.toLocaleString()} monedas\nLímite diario restante: ${(
                  DAILY_LIMIT -
                  dailyTransferred -
                  transferAmount
                ).toLocaleString()} MC`,
                [
                  {
                    text: "Aceptar",
                    onPress: () => {
                      setRecipient("");
                      setAmount("");
                      setFormattedAmount("");
                      setMessage("");
                      loadRecentContacts();
                      // Actualizar los datos después de la transferencia
                      refreshCoins();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Error en transferencia:", error);
              Alert.alert(
                "❌ Error en Transferencia",
                error.message ||
                  "No se pudo completar la transferencia. Por favor, intenta nuevamente."
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleQuickAmount = (quickAmount) => {
    if (!validateDailyLimit(quickAmount)) {
      return;
    }
    setAmount(quickAmount.toString());
    setFormattedAmount(quickAmount.toLocaleString());
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatUserId = (userId) => {
    if (!userId) return "N/A";
    if (userId.length <= 8) return userId;
    return `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`;
  };

  const getContactIcon = (contact) => {
    if (contact.type === "transferencia_saliente") {
      return { name: "arrow-up", color: "#FF6B6B" };
    } else if (contact.type === "transferencia_entrante") {
      return { name: "arrow-down", color: "#32CD32" };
    }
    return { name: "person", color: "#FFD700" };
  };

  const showAllContactsModalHandler = () => {
    setShowAllContactsModal(true);
  };

  // Mostrar solo 3 contactos inicialmente
  const getContactsToShow = () => {
    return recentContacts.slice(0, 3);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando saldo...</Text>
      </View>
    );
  }

  const formatCoins = (coins) => {
    return coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const remainingLimit = DAILY_LIMIT - dailyTransferred;

  const AllContactsModal = () => (
    <Modal
      visible={showAllContactsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAllContactsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>TODOS LOS CONTACTOS</Text>
            <TouchableOpacity onPress={() => setShowAllContactsModal(false)}>
              <Ionicons name="close" size={24} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            {recentContacts.length > 0 ? (
              recentContacts.map((contact) => {
                const contactIcon = getContactIcon(contact);
                return (
                  <View key={contact.id} style={styles.modalContactItem}>
                    <TouchableOpacity
                      style={styles.contactMain}
                      onPress={() => {
                        setRecipient(contact.email || contact.id);
                        setShowAllContactsModal(false);
                      }}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>
                          {getInitials(contact.name)}
                        </Text>
                        <View
                          style={[
                            styles.onlineIndicator,
                            { backgroundColor: contactIcon.color },
                          ]}
                        />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactEmail}>
                          {contact.email || "Sin email"}
                        </Text>
                        <View style={styles.contactIdContainer}>
                          <Text style={styles.contactId}>
                            ID: {formatUserId(contact.id)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.copyButton,
                        { backgroundColor: `${contactIcon.color}20` },
                      ]}
                      onPress={() => copyToClipboard(contact.id)}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={16}
                        color={contactIcon.color}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.noContacts}>
                <Ionicons name="people-outline" size={32} color="#666" />
                <Text style={styles.noContactsText}>No hay contactos</Text>
                <Text style={styles.noContactsSubtext}>
                  Tus contactos aparecerán aquí después de hacer transferencias
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={require("../assets/fondologin.jpg")}
      style={styles.background}
      blurRadius={2}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="paw" size={28} color="#FFD700" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.japaneseTitle}>招きカジノ</Text>
              <Text style={styles.englishTitle}>MANEKI CASINO</Text>
            </View>
          </View>
        </View>

        {/* Título de la pantalla */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>TRANSFERIR FONDOS</Text>
          <Text style={styles.screenSubtitle}>Comparte tu fortuna</Text>
        </View>

        {/* Límite diario */}
        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <Ionicons name="calendar" size={20} color="#FFD700" />
            <Text style={styles.limitTitle}>LÍMITE DIARIO</Text>
          </View>
          <View style={styles.limitInfo}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Transferido hoy:</Text>
              <Text style={styles.limitValue}>
                {formatCoins(dailyTransferred)} MC
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Límite restante:</Text>
              <Text
                style={[
                  styles.limitValue,
                  remainingLimit < 1000 && styles.limitWarning,
                ]}
              >
                {formatCoins(remainingLimit)} MC
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Límite total:</Text>
              <Text style={styles.limitValue}>
                {formatCoins(DAILY_LIMIT)} MC
              </Text>
            </View>
          </View>
          <View style={styles.limitBar}>
            <View
              style={[
                styles.limitProgress,
                {
                  width: `${Math.min(
                    (dailyTransferred / DAILY_LIMIT) * 100,
                    100
                  )}%`,
                  backgroundColor:
                    dailyTransferred > DAILY_LIMIT * 0.8
                      ? "#FF6B6B"
                      : "#FFD700",
                },
              ]}
            />
          </View>
        </View>

        {/* Saldo actual - SIN ENVIVO */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>TU FORTUNA ACTUAL</Text>
            <View style={styles.coinIcon}>
              <Ionicons name="diamond" size={24} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.balanceAmount}>
            {formatCoins(manekiCoins)} MC
          </Text>
          <View style={styles.fortuneBar}>
            <View
              style={[
                styles.fortuneProgress,
                { width: `${Math.min((manekiCoins / 10000) * 100, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Formulario de transferencia */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.formTitle}>NUEVA TRANSFERENCIA</Text>
            <Text style={styles.formSubtitle}>Comparte buena fortuna</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>DESTINATARIO</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person"
                size={20}
                color="#FF6B6B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email o ID de casino"
                placeholderTextColor="#A0A0A0"
                value={recipient}
                onChangeText={setRecipient}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.inputHelp}>
              Ingresa el email o ID de casino del destinatario
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MONTO (Maneki Coins)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="cash"
                size={20}
                color="#FF6B6B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={formattedAmount}
                onChangeText={formatAmount}
                maxLength={11}
              />
            </View>

            {/* Botones rápidos de cantidad */}
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsLabel}>Cantidades rápidas:</Text>
              <View style={styles.quickAmounts}>
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      amount === quickAmount.toString() &&
                        styles.quickAmountButtonSelected,
                      quickAmount > remainingLimit &&
                        styles.quickAmountButtonDisabled,
                    ]}
                    onPress={() => handleQuickAmount(quickAmount)}
                    disabled={
                      quickAmount > manekiCoins || quickAmount > remainingLimit
                    }
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === quickAmount.toString() &&
                          styles.quickAmountTextSelected,
                        (quickAmount > manekiCoins ||
                          quickAmount > remainingLimit) &&
                          styles.quickAmountTextDisabled,
                      ]}
                    >
                      {quickAmount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MENSAJE (OPCIONAL)</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Que esta transferencia te traiga buena fortuna..."
              placeholderTextColor="#A0A0A0"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>
              {message.length}/100 caracteres
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.transferButton,
              isProcessing && styles.transferButtonDisabled,
              (!recipient ||
                !amount ||
                parseInt(amount) < 10 ||
                parseInt(amount) > remainingLimit) &&
                styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={
              isProcessing ||
              !recipient ||
              !amount ||
              parseInt(amount) < 10 ||
              parseInt(amount) > remainingLimit
            }
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.transferButtonText}>PROCESANDO...</Text>
              </View>
            ) : (
              <View style={styles.transferButtonContent}>
                <Text style={styles.transferButtonText}>TRANSFERIR FONDOS</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Contactos recientes */}
        <View style={styles.contactsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.contactsTitle}>CONTACTOS RECIENTES</Text>
            <Text style={styles.contactsSubtitle}>
              {recentContacts.length > 0
                ? "Tus últimas transferencias"
                : "Personas que atraen prosperidad"}
            </Text>
          </View>

          {loadingContacts ? (
            <View style={styles.contactsLoading}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.contactsLoadingText}>
                Cargando contactos...
              </Text>
            </View>
          ) : recentContacts.length > 0 ? (
            <>
              {getContactsToShow().map((contact) => {
                const contactIcon = getContactIcon(contact);
                return (
                  <View key={contact.id} style={styles.contactItem}>
                    <TouchableOpacity
                      style={styles.contactMain}
                      onPress={() => setRecipient(contact.email || contact.id)}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>
                          {getInitials(contact.name)}
                        </Text>
                        <View
                          style={[
                            styles.onlineIndicator,
                            { backgroundColor: contactIcon.color },
                          ]}
                        />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactEmail}>
                          {contact.email || "Sin email"}
                        </Text>
                        <View style={styles.contactIdContainer}>
                          <Text style={styles.contactId}>
                            ID: {formatUserId(contact.id)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.copyButton,
                        { backgroundColor: `${contactIcon.color}20` },
                      ]}
                      onPress={() => copyToClipboard(contact.id)}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={16}
                        color={contactIcon.color}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Botón "Ver más contactos" que abre el modal */}
              {recentContacts.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={showAllContactsModalHandler}
                >
                  <Text style={styles.showMoreText}>
                    VER MÁS CONTACTOS ({recentContacts.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFD700" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noContacts}>
              <Ionicons name="people-outline" size={32} color="#666" />
              <Text style={styles.noContactsText}>
                No hay contactos recientes
              </Text>
              <Text style={styles.noContactsSubtext}>
                Tus contactos aparecerán aquí después de hacer transferencias
              </Text>
            </View>
          )}
        </View>

        {/* Información importante */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.infoTitle}>INFORMACIÓN IMPORTANTE</Text>
            <Text style={styles.infoSubtitle}>Términos y condiciones</Text>
          </View>
          <View style={styles.infoItems}>
            <View style={styles.infoItem}>
              <Ionicons name="flash" size={16} color="#FFD700" />
              <Text style={styles.infoText}>Transferencia instantánea</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
              <Text style={styles.infoText}>Protegido por Maneki</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="card" size={16} color="#FFD700" />
              <Text style={styles.infoText}>Mínimo 10 monedas</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trending-up" size={16} color="#FFD700" />
              <Text style={styles.infoText}>Límite diario: 20,000 MC</Text>
            </View>
          </View>
        </View>

        {/* Estadísticas de transferencia */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#FFD700" />
            <Text style={styles.statNumber}>Instantáneo</Text>
            <Text style={styles.statLabel}>PROCESAMIENTO</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={20} color="#FFD700" />
            <Text style={styles.statNumber}>0%</Text>
            <Text style={styles.statLabel}>COMISIÓN</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="business" size={20} color="#FFD700" />
            <Text style={styles.statNumber}>20,000</Text>
            <Text style={styles.statLabel}>LÍMITE DIARIO</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal para mostrar todos los contactos */}
      <AllContactsModal />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 15, 15, 0.95)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: "#8B0000",
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  titleContainer: {
    flex: 1,
  },
  japaneseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  englishTitle: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "300",
    letterSpacing: 2,
    marginTop: 2,
  },
  screenHeader: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  screenTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  screenSubtitle: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
    letterSpacing: 1,
  },
  limitCard: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  limitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 8,
  },
  limitTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  limitInfo: {
    marginBottom: 15,
  },
  limitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  limitLabel: {
    color: "#E8E8E8",
    fontSize: 14,
  },
  limitValue: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  limitWarning: {
    color: "#FF6B6B",
  },
  limitBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  limitProgress: {
    height: "100%",
    borderRadius: 3,
  },
  balanceCard: {
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  balanceLabel: {
    color: "#E8E8E8",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceAmount: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  fortuneBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  fortuneProgress: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  formCard: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  cardHeader: {
    marginBottom: 20,
  },
  formTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 1,
  },
  formSubtitle: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#E8E8E8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  messageInput: {
    height: 80,
    textAlignVertical: "top",
  },
  inputHelp: {
    color: "#A0A0A0",
    fontSize: 12,
    marginTop: 5,
    fontStyle: "italic",
  },
  charCount: {
    color: "#666",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  quickAmountsContainer: {
    marginTop: 10,
  },
  quickAmountsLabel: {
    color: "#A0A0A0",
    fontSize: 12,
    marginBottom: 8,
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAmountButton: {
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  quickAmountButtonSelected: {
    backgroundColor: "#FFD700",
  },
  quickAmountButtonDisabled: {
    backgroundColor: "rgba(102, 102, 102, 0.3)",
    borderColor: "rgba(102, 102, 102, 0.5)",
  },
  quickAmountText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  quickAmountTextSelected: {
    color: "#000",
  },
  quickAmountTextDisabled: {
    color: "#666",
    opacity: 0.5,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  transferButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#666",
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  transferButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  transferButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  contactsCard: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  contactsTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 1,
  },
  contactsSubtitle: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 107, 0.1)",
  },
  contactMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#8B0000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  contactAvatarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactEmail: {
    color: "#A0A0A0",
    fontSize: 11,
    marginBottom: 1,
  },
  contactIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactId: {
    color: "#666",
    fontSize: 10,
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 10,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    gap: 8,
  },
  showMoreText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  contactsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  contactsLoadingText: {
    color: "#FFD700",
    fontSize: 14,
  },
  noContacts: {
    alignItems: "center",
    padding: 20,
  },
  noContactsText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  noContactsSubtext: {
    color: "#A0A0A0",
    fontSize: 12,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  infoTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 1,
  },
  infoSubtitle: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  infoItems: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 107, 0.1)",
  },
  infoText: {
    color: "white",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  statNumber: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 4,
  },
  statLabel: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
  },
  loadingText: {
    color: "#FFD700",
    marginTop: 10,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalContactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 107, 107, 0.1)",
  },
});
