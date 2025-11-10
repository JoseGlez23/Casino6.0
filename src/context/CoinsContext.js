// src/context/CoinsContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";

const CoinsContext = createContext();

export const useCoins = () => {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error("useCoins debe ser usado dentro de un CoinsProvider");
  }
  return context;
};

// ==== Parámetros de economía (documentados) ====
// - Coins iniciales: 1000 (se insertan al crear user_coins por 1a vez)
// - Tickets iniciales: 0
// - Equivalencia tickets→MXN: 1000 tickets = $10 MXN (se aplica en el RPC)

export const CoinsProvider = ({ children }) => {
  const [manekiCoins, setManekiCoins] = useState(1000);
  const [tickets, setTickets] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const isInitialized = useRef(false);
  const subscriptionRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    if (isInitialized.current) return;
    initializeCoinsSystem();

    return () => {
      if (subscriptionRef.current?.coins)
        subscriptionRef.current.coins.unsubscribe();
      if (subscriptionRef.current?.transactions)
        subscriptionRef.current.transactions.unsubscribe();
    };
  }, []);

  const initializeCoinsSystem = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userIdRef.current = user.id;
        await loadInitialData(user.id);
        await setupRealtimeSubscriptions(user.id);
        isInitialized.current = true;
      } else {
        await loadFromAsyncStorage();
        isInitialized.current = true;
      }
    } catch (error) {
      console.error("❌ Error inicializando sistema:", error);
      await loadFromAsyncStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async (userId) => {
    try {
      const [coinsData, ticketsData, transactionsData] = await Promise.all([
        loadCoinsFromSupabase(userId),
        loadTicketsFromSupabase(userId),
        loadTransactionsFromSupabase(userId),
      ]);

      setManekiCoins(coinsData);
      setTickets(ticketsData);
      setTransactions(transactionsData);
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error("❌ Error cargando datos iniciales:", error);
      throw error;
    }
  };

  const loadCoinsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("maneki_coins")
        .eq("user_id", userId)
        .single();

      if (error) {
        // PGRST116 = no rows
        if (error.code === "PGRST116") {
          await initializeUserData(userId); // crea registro + bonus
          return 1000;
        }
        throw error;
      }
      return data?.maneki_coins ?? 1000;
    } catch (error) {
      console.error("❌ Error cargando coins:", error);
      return 1000;
    }
  };

  const loadTicketsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("tickets")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return 0;
        throw error;
      }
      return data?.tickets ?? 0;
    } catch (error) {
      console.error("❌ Error cargando tickets:", error);
      return 0;
    }
  };

  const loadTransactionsFromSupabase = async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        date: t.created_at,
        created_at: t.created_at,
        balance: t.balance_after ?? 0,
        balance_after: t.balance_after ?? 0,
        user_dest: t.user_dest,
        mensaje: t.mensaje ?? null,
      }));
    } catch (error) {
      console.error("❌ Error cargando transacciones:", error);
      return [];
    }
  };

  // Crea user_coins inicial (1000 coins / 0 tickets) + registra bonus_inicial
  const initializeUserData = async (userId) => {
    try {
      // 1) Crear registro base
      const { error: upsertErr } = await supabase.from("user_coins").upsert(
        {
          user_id: userId,
          maneki_coins: 1000,
          tickets: 0,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (upsertErr) throw upsertErr;

      // 2) Registrar transacción inicial (bonus)
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "bonus_inicial",
        amount: 1000,
        description: "Bono inicial por registro",
        balance_after: 1000,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      console.log("✅ Registro inicial creado + bonus_inicial cargado");
    } catch (error) {
      console.error("❌ Error inicializando datos:", error);
    }
  };

  const updateUserDataInDatabase = async (userId, newCoins, newTickets) => {
    try {
      const { error } = await supabase.from("user_coins").upsert(
        {
          user_id: userId,
          maneki_coins: newCoins,
          tickets: newTickets,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("❌ Error actualizando base:", error);
      throw error;
    }
  };

  const setupRealtimeSubscriptions = async (userId) => {
    try {
      const coinsSubscription = supabase
        .channel("coins-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_coins",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new) {
              if (payload.new.maneki_coins !== undefined)
                setManekiCoins(payload.new.maneki_coins);
              if (payload.new.tickets !== undefined)
                setTickets(payload.new.tickets);
            }
          }
        )
        .subscribe();

      const transactionsSubscription = supabase
        .channel("transactions-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const newTx = await loadTransactionsFromSupabase(userId);
            setTransactions(newTx);
          }
        )
        .subscribe();

      subscriptionRef.current = {
        coins: coinsSubscription,
        transactions: transactionsSubscription,
      };
    } catch (error) {
      console.error("❌ Error suscripciones realtime:", error);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      const [savedCoins, savedTickets, savedTransactions] = await Promise.all([
        AsyncStorage.getItem("manekiCoins"),
        AsyncStorage.getItem("manekiTickets"),
        AsyncStorage.getItem("coinTransactions"),
      ]);

      if (savedCoins) setManekiCoins(parseInt(savedCoins));
      if (savedTickets) setTickets(parseInt(savedTickets));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    } catch (error) {
      console.error("❌ Error cargando AsyncStorage:", error);
    }
  };

  // ===== API PRINCIPAL =====

  const refreshCoins = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Cargar TODO en paralelo para consistencia
        const [currentCoins, currentTickets, currentTransactions] =
          await Promise.all([
            loadCoinsFromSupabase(user.id),
            loadTicketsFromSupabase(user.id),
            loadTransactionsFromSupabase(user.id),
          ]);

        console.log(
          `🔄 Refresh: Coins=${currentCoins}, Tickets=${currentTickets}`
        );

        // Actualizar estado de forma atómica
        setManekiCoins(currentCoins);
        setTickets(currentTickets);
        setTransactions(currentTransactions);
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      console.error("❌ Error refrescando datos:", error);
      throw error;
    }
  };

  // Agregar coins (compras / premios / bonos)
  const addCoins = async (amount, description = "Compra de monedas") => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const newBalance = manekiCoins + amount;
      setManekiCoins(newBalance);
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      // Determinar tipo
      const lower = (description || "").toLowerCase();
      const txType = lower.includes("compra")
        ? "compra_coins"
        : "ganancia_coins";

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: txType,
        amount: amount,
        description,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      return newBalance;
    } catch (error) {
      console.error("❌ Error agregando coins:", error);
      await refreshCoins();
      throw error;
    }
  };

  // Restar coins (apuestas)
  const subtractCoins = async (amount, description = "Apuesta en juego") => {
    try {
      if (manekiCoins < amount) throw new Error("Fondos insuficientes");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const newBalance = manekiCoins - amount;
      setManekiCoins(newBalance);
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "gasto_juego",
        amount: -amount,
        description,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      return newBalance;
    } catch (error) {
      console.error("❌ Error restando coins:", error);
      await refreshCoins();
      throw error;
    }
  };

  // Agregar tickets (premios de juego)
  const addTickets = async (amount, description = "Ganancia en juego") => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const newTickets = tickets + amount;
      setTickets(newTickets);
      await updateUserDataInDatabase(user.id, manekiCoins, newTickets);

      // Registrar en ledger (tickets)
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "ganancia_tickets",
        amount: amount,
        description,
        // balance_after aquí lo usamos para mostrar saldo de tickets en UI cuando filtres por 'tickets'
        balance_after: newTickets,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      return newTickets;
    } catch (error) {
      console.error("❌ Error agregando tickets:", error);
      await refreshCoins();
      throw error;
    }
  };

  // SOLUCIÓN CORREGIDA: Solicitar retiro de tickets
  const solicitarRetiroTickets = async (ticketAmount) => {
    try {
      if (!ticketAmount || ticketAmount <= 0)
        throw new Error("Ingresa una cantidad válida de tickets");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // 1. VERIFICACIÓN EN TIEMPO REAL - Cargar tickets actuales desde BD
      const currentTicketsFromDB = await loadTicketsFromSupabase(user.id);
      console.log(
        `🎫 Tickets en BD: ${currentTicketsFromDB}, Solicitados: ${ticketAmount}`
      );

      if (ticketAmount > currentTicketsFromDB)
        throw new Error(
          `No tienes suficientes tickets. Disponibles: ${currentTicketsFromDB}`
        );

      // 2. Sincronizar estado local con BD antes de proceder
      setTickets(currentTicketsFromDB);

      // 3. Llamar al RPC
      const { data: result, error: rpcErr } = await supabase.rpc(
        "solicitar_retiro_tickets",
        {
          usuario_id: user.id,
          tickets_retirar: ticketAmount,
        }
      );

      if (rpcErr) throw rpcErr;
      if (!result?.exito)
        throw new Error(result?.error || "No se pudo procesar el retiro");

      // 4. Actualizar estado local con el valor devuelto por el RPC
      const nuevosTickets =
        result.tickets_restantes ?? currentTicketsFromDB - ticketAmount;
      setTickets(nuevosTickets);

      // 5. Registrar transacción
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "retiro_tickets",
        amount: -ticketAmount,
        description: `Retiro de tickets (${ticketAmount})`,
        balance_after: nuevosTickets,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      // 6. Forzar refresh completo para asegurar consistencia
      await refreshCoins();

      console.log(`✅ Retiro exitoso. Tickets restantes: ${nuevosTickets}`);
      return result;
    } catch (error) {
      console.error("❌ Error solicitando retiro de tickets:", error);
      // Forzar sync en caso de error
      await refreshCoins();
      throw error;
    }
  };

  // Transferencias entre usuarios (RPC existente con mensaje)
  const transferCoins = async (
    amount,
    recipientIdentifier,
    description = "Transferencia",
    mensaje = null
  ) => {
    try {
      if (!recipientIdentifier?.trim())
        throw new Error("Ingresa el email o ID de casino del destinatario");
      if (!amount || amount <= 0) throw new Error("Ingresa un monto válido");
      if (amount < 10)
        throw new Error("El monto mínimo de transferencia es 10 monedas");
      if (amount > manekiCoins) throw new Error("Fondos insuficientes");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: result, error: transferError } = await supabase.rpc(
        "transferir_monedas",
        {
          remitente_id: user.id,
          destinatario_identificador: recipientIdentifier.trim(),
          monto: amount,
          descripcion: description,
          mensaje_transferencia: mensaje,
        }
      );
      if (transferError) throw transferError;
      if (!result?.exito)
        throw new Error(result?.error || "Transferencia rechazada");

      setManekiCoins(result.nuevo_saldo);
      await refreshCoins();

      return {
        success: true,
        newBalance: result.nuevo_saldo,
        recipientName: result.nombre_destinatario,
        recipientId: result.identificador_destinatario,
        amount: result.monto_transferido,
        mensaje: result.mensaje || mensaje,
      };
    } catch (error) {
      console.error("❌ Error en transferencia:", error);
      await refreshCoins();
      throw error;
    }
  };

  // Función para debuggear estado actual
  const debugState = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const dbCoins = await loadCoinsFromSupabase(user.id);
      const dbTickets = await loadTicketsFromSupabase(user.id);
      console.log(
        `🔍 DEBUG - Estado local: Coins=${manekiCoins}, Tickets=${tickets}`
      );
      console.log(
        `🔍 DEBUG - Estado BD: Coins=${dbCoins}, Tickets=${dbTickets}, User: ${user.id}`
      );
    }
  };

  const getTransactionHistory = (limit = 50) => transactions.slice(0, limit);
  const canAfford = (amount) => manekiCoins >= amount;

  // Bono diario (usa ledger de coins como ganancia_coins si no es compra)
  const getDailyBonus = async () => {
    return await addCoins(1000, "Bono diario");
  };

  const resetCoins = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await initializeUserData(user.id);
      await refreshCoins();
    }
  };

  const value = {
    manekiCoins,
    tickets,
    transactions,
    isLoading,
    lastSync,
    addCoins,
    subtractCoins,
    addTickets,
    solicitarRetiroTickets,
    transferCoins,
    resetCoins,
    refreshCoins,
    getTransactionHistory,
    canAfford,
    getDailyBonus,
    debugState, // Agregada para debugging
  };

  return (
    <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>
  );
};
