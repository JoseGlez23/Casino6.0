// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Claves para SecureStore
  const AUTH_TOKEN_KEY = 'maneki_auth_token';
  const USER_DATA_KEY = 'maneki_user_data';

  // Guardar token y datos de usuario en SecureStore
  const storeAuthData = async (authToken, userData) => {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authToken);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error guardando datos de autenticación:', error);
    }
  };

  // Obtener datos de autenticación guardados
  const getStoredAuthData = async () => {
    try {
      const [authToken, userData] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_DATA_KEY),
      ]);

      if (authToken && userData) {
        setToken(authToken);
        setUser(JSON.parse(userData));
        return { token: authToken, user: JSON.parse(userData) };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo datos de autenticación:', error);
      return null;
    }
  };

  // Limpiar datos de autenticación
  const clearAuthData = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error limpiando datos de autenticación:', error);
    }
  };

  // Iniciar sesión
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        // Crear un token personalizado (puedes usar el access_token de Supabase o generar uno propio)
        const authToken = data.session.access_token;
        
        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const userData = {
          id: data.user.id,
          email: data.user.email,
          ...profile
        };

        await storeAuthData(authToken, userData);
        return { success: true, user: userData };
      }

      throw new Error('Error en el inicio de sesión');
    } catch (error) {
      console.error('Error en signIn:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Registrar usuario
  const signUp = async (userData) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            nombre_completo: userData.nombre_completo,
            fecha_nacimiento: userData.fecha_nacimiento,
            pais_residencia: userData.pais_residencia,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Aquí ya tienes el usuario creado en auth.users
        // El trigger automáticamente creará el registro en la tabla usuarios
        return { 
          success: true, 
          message: 'Usuario registrado exitosamente. Por favor verifica tu email.' 
        };
      }

      throw new Error('Error en el registro');
    } catch (error) {
      console.error('Error en signUp:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Limpiar datos locales
      await clearAuthData();
      
      return { success: true };
    } catch (error) {
      console.error('Error en signOut:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticación al cargar la app
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const storedData = await getStoredAuthData();
      
      if (storedData && storedData.token) {
        // Verificar si el token sigue siendo válido
        const { data: { user }, error } = await supabase.auth.getUser(storedData.token);
        
        if (error || !user) {
          // Token inválido, limpiar datos
          await clearAuthData();
          setLoading(false);
          return false;
        }

        // Token válido, usuario autenticado
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error en checkAuth:', error);
      await clearAuthData();
      setLoading(false);
      return false;
    }
  };

  // Actualizar datos del usuario
  const updateUserProfile = async (updatedData) => {
    try {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('usuarios')
        .update(updatedData)
        .eq('id', user.id);

      if (error) throw error;

      // Actualizar datos locales
      const newUserData = { ...user, ...updatedData };
      await storeAuthData(token, newUserData);

      return { success: true, user: newUserData };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Efecto para verificar autenticación al iniciar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    signIn,
    signUp,
    signOut,
    checkAuth,
    updateUserProfile,
    clearAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};