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
const MXN_PER_TICKET = 0.10;     // 1 ticket = $0.10 MXN
const MIN_TICKETS = 200;
const MAX_TICKETS = 100000;
const FEE_PCT = 0.10;            // 10%

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

  // Historial SOLO de tickets
  const ticketHistory = useMemo(() => {
    return (transactions || []).filter(
      (t) => t.type === "ganancia_tickets" || t.type === "retiro_tickets"
    );
  }, [transactions]);

  // Helpers
  const toInt = (v) => {
    const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const fmtCurrency = (mxn) =>
    `$${(mxn ?? 0).toFixed(2)} MXN`;

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

  // UI actions
  const handleQuick = (n) => {
    const cur = toInt(amount);
    const next = clamp(cur + n, 0, Math.min(MAX_TICKETS, tickets));
    setAmount(String(next));
  };

  const handleMax = () => {
    const m = clamp(tickets, MIN_TICKETS, MAX_TICKETS);
    setAmount(String(m));
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
        `El mínimo de retiro es ${MIN_TICKETS} tickets.`
      );
      return;
    }
    if (n > MAX_TICKETS) {
      Alert.alert(
        "Máximo excedido",
        `El máximo de retiro es ${MAX_TICKETS} tickets.`
      );
      return;
    }
    if (n > tickets) {
      Alert.alert(
        "Tickets insuficientes",
        `Tu saldo actual es ${tickets} tickets.`
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
  };

  const doWithdraw = async () => {
    try {
      setSubmitting(true);
      const n = validQty;
      if (!n) throw new Error("Cantidad inválida o fuera de rango.");

      const result = await solicitarRetiroTickets(n);
      setStep2Visible(false);
      setAmount("");

      Alert.alert(
        "Retiro solicitado",
        `Se retiraron ${n} tickets.\nMonto bruto: ${fmtCurrency(
          n * MXN_PER_TICKET
        )}\nFee (10%): ${fmtCurrency((n * MXN_PER_TICKET) * FEE_PCT)}\nA pagar: ${fmtCurrency(
          (n * MXN_PER_TICKET) * (1 - FEE_PCT)
        )}`
      );
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo procesar el retiro.");
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
    const isGain = item.type === "ganancia_tickets";
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
            {new Date(item.created_at || item.date).toLocaleString()}
          </Text>
          {!!item.description && (
            <Text style={styles.txDesc}>{item.description}</Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.txAmt, { color: isGain ? "#4CAF50" : "#FF6B6B" }]}>
            {isGain ? "+" : "-"}{t} tks
          </Text>
          <Text style={styles.txMXN}>{fmtCurrency(mxnGross)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      {/* Header simple */}


      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FFD700"]}
            tintColor="#FFD700"
            title="Actualizando..."
            titleColor="#FFD700"
          />
        }
      >
        {/* Saldo actual */}
        <View style={styles.balanceCard}>
          <HeaderStat icon="ticket" label="Tickets" value={`${tickets}`} />
          <View style={styles.dividerV} />
          <HeaderStat
            icon="cash"
            label="Equivalente"
            value={fmtCurrency(tickets * MXN_PER_TICKET)}
          />
        </View>

        {/* Formulario Retiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retirar tickets</Text>
          <Text style={styles.helpText}>
            Mínimo {MIN_TICKETS} · Máximo {MAX_TICKETS} · Fee 10% MXN
          </Text>

          <View style={styles.inputRow}>
            <Ionicons name="ticket" size={18} color="#FFD700" />
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ""))}
              placeholder="Cantidad de tickets"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
              maxLength={6}
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
                <Text style={styles.quickBtnText}>+{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview financiero */}
          <View style={styles.previewCard}>
            <Row label="Monto bruto" value={fmtCurrency(validQty * MXN_PER_TICKET)} />
            <Row label="Fee (10%)" value={fmtCurrency(preview.fee)} />
            <Row label="Recibirás" value={fmtCurrency(preview.mxnNet)} bold />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!validQty || submitting) && { opacity: 0.6 },
            ]}
            disabled={!validQty || submitting}
            onPress={openStep1}
          >
            <Ionicons name="shield-checkmark" size={18} color="#000" />
            <Text style={styles.primaryBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>

        {/* Historial */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Historial de tickets</Text>
          {ticketHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={32} color="#777" />
              <Text style={styles.emptyText}>Aún no tienes movimientos de tickets</Text>
            </View>
          ) : (
            ticketHistory.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Paso 1: Confirmación */}
      <Modal visible={step1Visible} transparent animationType="fade" onRequestClose={() => setStep1Visible(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar retiro</Text>
            <Text style={styles.modalText}>
              Retirarás {validQty} tickets.
            </Text>
            <View style={[styles.previewCard, { marginTop: 10 }]}>
              <Row label="Bruto" value={fmtCurrency(validQty * MXN_PER_TICKET)} />
              <Row label="Fee (10%)" value={fmtCurrency(preview.fee)} />
              <Row label="A pagar" value={fmtCurrency(preview.mxnNet)} bold />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={cancelAll}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={confirmStep1}>
                <Ionicons name="checkmark-circle" size={18} color="#000" />
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paso 2: Confirmación Final */}
      <Modal visible={step2Visible} transparent animationType="fade" onRequestClose={() => setStep2Visible(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmación final</Text>
            <Text style={styles.modalText}>
              ¿Deseas proceder? Esta acción descontará los tickets de tu saldo.
            </Text>
            <View style={[styles.previewCard, { marginTop: 10 }]}>
              <Row label="Tickets a retirar" value={`${validQty} tks`} />
              <Row label="A pagar" value={fmtCurrency(preview.mxnNet)} bold />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={cancelAll}>
                <Text style={styles.secondaryBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                onPress={doWithdraw}
                disabled={submitting}
              >
                <Ionicons name="cash" size={18} color="#000" />
                <Text style={styles.primaryBtnText}>
                  {submitting ? "Procesando..." : "Retirar"}
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
    <Text style={[styles.rowLabel, bold && { fontWeight: "bold" }]}>{label}</Text>
    <Text style={[styles.rowValue, bold && { fontWeight: "bold" }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#8B0000",
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },

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
    paddingVertical: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  modalText: { color: "#ddd" },
  modalBtns: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
});
