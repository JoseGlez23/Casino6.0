// src/screens/TicketScreen.js
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../context/CoinsContext";

const { width } = Dimensions.get("window");

// Parámetros oficiales
const MXN_PER_TICKET = 0.1; // 1 ticket = $0.10 MXN
const MIN_TICKETS = 200;
const MAX_TICKETS = 100000;
const FEE_PCT = 0.1; // 10%

export default function TicketScreen({ navigation }) {
  const {
    tickets,
    transactions,
    solicitarRetiroTickets,
    refreshCoins,
    isLoading,
  } = useCoins();

  const [amount, setAmount] = useState("");
  const [step1Visible, setStep1Visible] = useState(false);
  const [step2Visible, setStep2Visible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bankAccount, setBankAccount] = useState("");

  // ✅ HISTORIAL ACTUALIZADO - usar tipos correctos
  const ticketHistory = useMemo(() => {
    return (transactions || []).filter(
      (t) => t.type === "ganancia" || t.type === "retiro" // ✅ Tipos actualizados
    );
  }, [transactions]);

  // Helpers
  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toInt = (v) => {
    const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const fmtCurrency = (mxn) => `$${(mxn ?? 0).toFixed(2)} MXN`;

  const computePreview = (ticketQty) => {
    const mxnGross = ticketQty * MXN_PER_TICKET;
    const fee = mxnGross * FEE_PCT;
    const mxnNet = mxnGross - fee;
    return { mxnGross, fee, mxnNet };
  };

  const validQty = useMemo(() => {
    const n = toInt(amount);
    if (n < MIN_TICKETS || n > MAX_TICKETS) return 0;
    if (n > tickets) return 0;
    return n;
  }, [amount, tickets]);

  const preview = useMemo(() => computePreview(validQty), [validQty]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCoins();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCoins]);

  // Formatear cuenta bancaria (16 dígitos en grupos de 4)
  const formatBankAccount = (text) => {
    const cleanText = text.replace(/[^\d]/g, "").slice(0, 16);
    const groups = [];
    for (let i = 0; i < cleanText.length; i += 4) {
      groups.push(cleanText.slice(i, i + 4));
    }
    return groups.join(" ");
  };

  const handleBankAccountChange = (text) => {
    const formatted = formatBankAccount(text);
    setBankAccount(formatted);
  };

  // UI actions
  const handleQuick = (n) => {
    const cur = toInt(amount);
    const next = clamp(cur + n, 0, Math.min(MAX_TICKETS, tickets));
    setAmount(formatNumberWithCommas(next));
  };

  const handleMax = () => {
    const m = clamp(tickets, MIN_TICKETS, MAX_TICKETS);
    setAmount(formatNumberWithCommas(m));
  };

  const handleAmountChange = (text) => {
    // Remover todas las comas y caracteres no numéricos
    const cleanText = text.replace(/[^\d]/g, "");
    const numberValue = cleanText === "" ? "" : parseInt(cleanText, 10);

    if (cleanText === "") {
      setAmount("");
    } else if (!isNaN(numberValue)) {
      // Formatear con comas
      setAmount(formatNumberWithCommas(numberValue));
    }
  };

  const openStep1 = () => {
    const n = toInt(amount);
    if (!n) {
      Alert.alert("Cantidad inválida", "Ingresa una cantidad de tickets.");
      return;
    }
    if (n < MIN_TICKETS) {
      Alert.alert(
        "Mínimo no alcanzado",
        `El mínimo de retiro es ${formatNumberWithCommas(MIN_TICKETS)} tickets.`
      );
      return;
    }
    if (n > MAX_TICKETS) {
      Alert.alert(
        "Máximo excedido",
        `El máximo de retiro es ${formatNumberWithCommas(MAX_TICKETS)} tickets.`
      );
      return;
    }
    if (n > tickets) {
      Alert.alert(
        "Tickets insuficientes",
        `Tu saldo actual es ${formatNumberWithCommas(tickets)} tickets.`
      );
      return;
    }
    setStep1Visible(true);
  };

  const confirmStep1 = () => {
    setStep1Visible(false);
    setStep2Visible(true);
  };

  const cancelAll = () => {
    setStep1Visible(false);
    setStep2Visible(false);
    setBankAccount("");
  };

  const doWithdraw = async () => {
    // Validar cuenta bancaria (16 dígitos exactos)
    const cleanBankAccount = bankAccount.replace(/[^\d]/g, "");
    if (!cleanBankAccount) {
      Alert.alert(
        "Error",
        "Por favor ingresa tu cuenta bancaria para proceder con el retiro."
      );
      return;
    }

    if (cleanBankAccount.length !== 16) {
      Alert.alert(
        "Error",
        "La cuenta bancaria debe tener exactamente 16 dígitos."
      );
      return;
    }

    try {
      setSubmitting(true);
      const n = validQty;
      if (!n) throw new Error("Cantidad inválida o fuera de rango.");

      const result = await solicitarRetiroTickets(n);
      setStep2Visible(false);
      setAmount("");
      setBankAccount("");

      Alert.alert(
        "🎉 ¡Retiro Procesado Exitosamente!",
        `✅ Se han convertido ${formatNumberWithCommas(
          n
        )} tickets a dinero real.\n\n` +
          `💳 **Cuenta destino:** ${bankAccount}\n` +
          `💰 **Monto depositado:** ${fmtCurrency(preview.mxnNet)}\n` +
          `📊 **Tickets utilizados:** ${formatNumberWithCommas(n)}\n` +
          `🎫 **Tickets restantes:** ${formatNumberWithCommas(
            result.tickets_restantes
          )}\n\n` +
          `⏰ **El dinero estará disponible en tu cuenta bancaria en un plazo de 24 a 72 horas hábiles.**\n\n` +
          `¡Gracias por confiar en nosotros! 🎰`
      );
    } catch (err) {
      Alert.alert("❌ Error", err.message || "No se pudo procesar el retiro.");
    } finally {
      setSubmitting(false);
    }
  };

  // Components
  const HeaderStat = ({ icon, label, value }) => (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={22} color="#FFD700" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const HistoryItem = ({ item }) => {
    const isGain = item.type === "ganancia";
    const t = Math.abs(item.amount || 0);
    const { mxnGross } = computePreview(t);

    return (
      <View style={styles.txRow}>
        <View style={styles.txIconWrap}>
          <Ionicons
            name={isGain ? "ticket" : "cash-outline"}
            size={18}
            color={isGain ? "#4CAF50" : "#FF6B6B"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txTitle}>
            {isGain ? "Ganancia de tickets" : "Retiro de tickets"}
          </Text>
          <Text style={styles.txSub}>
            {new Date(item.created_at || item.date).toLocaleString("es-MX")}
          </Text>
          {!!item.description && (
            <Text style={styles.txDesc}>{item.description}</Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[styles.txAmt, { color: isGain ? "#4CAF50" : "#FF6B6B" }]}
          >
            {isGain ? "+" : "-"}
            {formatNumberWithCommas(t)} tks
          </Text>
          <Text style={styles.txMXN}>{fmtCurrency(mxnGross)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            colors={["#FFD700"]}
            tintColor="#FFD700"
          />
        }
      >
        {/* Saldo actual */}
        <View style={styles.balanceCard}>
          <HeaderStat
            icon="ticket"
            label="Tickets"
            value={formatNumberWithCommas(tickets)}
          />
          <View style={styles.dividerV} />
          <HeaderStat
            icon="cash"
            label="Equivalente"
            value={fmtCurrency(tickets * MXN_PER_TICKET)}
          />
        </View>

        {/* Formulario Retiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retirar Tickets</Text>
          <Text style={styles.helpText}>
            Mínimo {formatNumberWithCommas(MIN_TICKETS)} · Máximo{" "}
            {formatNumberWithCommas(MAX_TICKETS)} · Fee 10% MXN
          </Text>

          <View style={styles.inputRow}>
            <Ionicons name="ticket" size={18} color="#FFD700" />
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="Cantidad de tickets"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
              maxLength={9}
            />
            <TouchableOpacity onPress={handleMax} style={styles.maxBtn}>
              <Text style={styles.maxBtnText}>MAX</Text>
            </TouchableOpacity>
          </View>

          {/* Botones rápidos */}
          <View style={styles.quickRow}>
            {[200, 1000, 5000, 10000].map((n) => (
              <TouchableOpacity
                key={n}
                style={styles.quickBtn}
                onPress={() => handleQuick(n)}
              >
                <Text style={styles.quickBtnText}>
                  +{formatNumberWithCommas(n)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview financiero */}
          {validQty > 0 && (
            <View style={styles.previewCard}>
              <Row
                label="Monto bruto"
                value={fmtCurrency(validQty * MXN_PER_TICKET)}
              />
              <Row label="Fee (10%)" value={fmtCurrency(preview.fee)} />
              <Row label="Recibirás" value={fmtCurrency(preview.mxnNet)} bold />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!validQty || submitting) && { opacity: 0.6 },
            ]}
            disabled={!validQty || submitting}
            onPress={openStep1}
          >
            <Ionicons name="shield-checkmark" size={18} color="#000" />
            <Text style={styles.primaryBtnText}>
              {submitting ? "Procesando..." : "Continuar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Historial */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Historial de Tickets</Text>
          {ticketHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={32} color="#777" />
              <Text style={styles.emptyText}>
                Aún no tienes movimientos de tickets
              </Text>
            </View>
          ) : (
            ticketHistory.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Paso 1: Confirmación */}
      <Modal
        visible={step1Visible}
        transparent
        animationType="fade"
        onRequestClose={() => setStep1Visible(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="cash-outline" size={32} color="#FFD700" />
              <Text style={styles.modalTitle}>Confirmar Conversión</Text>
            </View>

            <View style={styles.conversionCard}>
              <Text style={styles.conversionTitle}>Resumen de Conversión</Text>

              <View style={styles.conversionRow}>
                <View style={styles.conversionIcon}>
                  <Ionicons name="ticket" size={20} color="#FFD700" />
                </View>
                <Text style={styles.conversionLabel}>Tickets a convertir:</Text>
                <Text style={styles.conversionValue}>
                  {formatNumberWithCommas(validQty)}
                </Text>
              </View>

              <View style={styles.conversionDivider} />

              <View style={styles.conversionRow}>
                <View style={styles.conversionIcon}>
                  <Ionicons name="trending-up" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.conversionLabel}>Monto bruto:</Text>
                <Text style={styles.conversionValue}>
                  {fmtCurrency(validQty * MXN_PER_TICKET)}
                </Text>
              </View>

              <View style={styles.conversionRow}>
                <View style={styles.conversionIcon}>
                  <Ionicons name="trending-down" size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.conversionLabel}>Fee (10%):</Text>
                <Text style={styles.conversionValue}>
                  -{fmtCurrency(preview.fee)}
                </Text>
              </View>

              <View style={styles.conversionDivider} />

              <View style={[styles.conversionRow, styles.totalRow]}>
                <View style={styles.conversionIcon}>
                  <Ionicons name="wallet" size={20} color="#32CD32" />
                </View>
                <Text style={styles.totalLabel}>Total a recibir:</Text>
                <Text style={styles.totalValue}>
                  {fmtCurrency(preview.mxnNet)}
                </Text>
              </View>
            </View>

            {/* BOTONES CORREGIDOS - MISMO TAMAÑO Y CENTRADOS */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={cancelAll}
              >
                <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={confirmStep1}
              >
                <Ionicons name="checkmark-circle" size={18} color="#000" />
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paso 2: Información Bancaria */}
      <Modal
        visible={step2Visible}
        transparent
        animationType="fade"
        onRequestClose={() => setStep2Visible(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="card" size={32} color="#FFD700" />
              <Text style={styles.modalTitle}>Información Bancaria</Text>
            </View>

            <Text style={styles.modalText}>
              Ingresa los 16 dígitos de tu cuenta bancaria para recibir:
            </Text>

            <View style={styles.amountHighlight}>
              <Text style={styles.amountHighlightText}>
                {fmtCurrency(preview.mxnNet)}
              </Text>
            </View>

            <View style={styles.bankInputContainer}>
              <Ionicons name="card-outline" size={20} color="#FFD700" />
              <TextInput
                value={bankAccount}
                onChangeText={handleBankAccountChange}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#999"
                style={styles.bankInput}
                keyboardType="numeric"
                maxLength={19} // 16 dígitos + 3 espacios
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.accountHelp}>
              <Ionicons name="information-circle" size={14} color="#FFD700" />
              <Text style={styles.accountHelpText}>
                Ingresa los 16 dígitos de tu cuenta
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="time" size={16} color="#FFD700" />
              <Text style={styles.infoText}>
                El depósito se realizará en un plazo de 24 a 72 horas hábiles
              </Text>
            </View>

            {/* BOTONES CORREGIDOS - MISMO TAMAÑO Y CENTRADOS */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={cancelAll}
              >
                <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                <Text style={styles.cancelBtnText}>Atrás</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.confirmBtn,
                  (submitting ||
                    bankAccount.replace(/[^\d]/g, "").length !== 16) && {
                    opacity: 0.6,
                  },
                ]}
                onPress={doWithdraw}
                disabled={
                  submitting || bankAccount.replace(/[^\d]/g, "").length !== 16
                }
              >
                <Ionicons name="cash" size={18} color="#000" />
                <Text style={styles.confirmBtnText}>
                  {submitting ? "Procesando..." : "Depositar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Row = ({ label, value, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && { fontWeight: "bold" }]}>
      {label}
    </Text>
    <Text style={[styles.rowValue, bold && { fontWeight: "bold" }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#8B0000",
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  backBtn: { padding: 6 },
  headerTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  placeholder: { width: 32 },

  // Balance
  balanceCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: { flex: 1, alignItems: "center", gap: 6 },
  statLabel: { color: "#bbb", fontSize: 12, letterSpacing: 0.3 },
  statValue: { color: "#FFD700", fontSize: 18, fontWeight: "bold" },
  dividerV: {
    width: 1,
    height: 40,
    backgroundColor: "#333",
    marginHorizontal: 12,
  },

  // Section
  section: { marginHorizontal: 16, marginTop: 4 },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  helpText: { color: "#aaa", fontSize: 12, marginBottom: 8 },

  // Input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26,26,26,0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, color: "#fff", fontSize: 16, marginLeft: 8 },
  maxBtn: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  maxBtnText: { color: "#000", fontWeight: "bold", fontSize: 12 },

  // Bank Input
  bankInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26,26,26,0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    height: 48,
    marginTop: 12,
  },
  bankInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 1,
  },

  // Account Help
  accountHelp: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  accountHelpText: {
    color: "#FFD700",
    fontSize: 12,
    fontStyle: "italic",
  },

  // Amount Highlight
  amountHighlight: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 12,
  },
  amountHighlightText: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "#8B0000",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    color: "#FFD700",
    fontSize: 12,
    flex: 1,
    fontStyle: "italic",
  },

  quickRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  quickBtn: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickBtnText: { color: "#FFD700", fontWeight: "bold", fontSize: 12 },

  // Preview
  previewCard: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "#bbb", fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14 },

  // Buttons
  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#000", fontWeight: "bold", fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryBtnText: { color: "#FFD700", fontWeight: "bold" },

  // History
  emptyBox: {
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { color: "#aaa" },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 10,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { color: "#fff", fontWeight: "600" },
  txSub: { color: "#888", fontSize: 12 },
  txDesc: { color: "#bbb", fontSize: 12, marginTop: 2 },
  txAmt: { fontWeight: "800", fontSize: 14 },
  txMXN: { color: "#bbb", fontSize: 12, marginTop: 2 },

  // Modals
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  modalTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 1,
  },
  modalText: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Botones del modal - ESTILOS MEJORADOS
  modalBtns: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
    borderWidth: 2,
  },
  cancelBtn: {
    borderColor: "#FF6B6B",
    backgroundColor: "transparent",
  },
  confirmBtn: {
    borderColor: "#FFD700",
    backgroundColor: "#FFD700",
  },
  cancelBtnText: {
    color: "#FF6B6B",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  confirmBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },

  // Conversion Card
  conversionCard: {
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  conversionTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  conversionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    gap: 10,
  },
  conversionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  conversionLabel: {
    color: "#bbb",
    fontSize: 14,
    flex: 1,
  },
  conversionValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  conversionDivider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  totalValue: {
    color: "#32CD32",
    fontSize: 16,
    fontWeight: "bold",
  },
});
