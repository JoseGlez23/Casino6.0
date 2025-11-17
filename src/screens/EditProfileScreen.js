// screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function EditProfileScreen({ navigation, route }) {
  const [userData, setUserData] = useState({
    nombre_completo: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userCoins, setUserCoins] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para el modal personalizado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ 
    title: '', 
    message: '', 
    type: 'info',
    onConfirm: null 
  });

  // Cargar datos del usuario
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showCustomAlert('Error', 'No se pudo obtener la información del usuario', 'error');
        return;
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Obtener coins del usuario
      const { data: coins, error: coinsError } = await supabase
        .from('user_coins')
        .select('maneki_coins, tickets')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);
      setUserCoins(coins);
      setUserData({
        nombre_completo: profile.nombre_completo || '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert('Error', 'Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar modales personalizados
  const showCustomAlert = (title, message, type = 'info', onConfirm = null) => {
    setModalData({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    // Validaciones básicas
    if (!userData.nombre_completo.trim()) {
      showCustomAlert('Error', 'El nombre no puede estar vacío', 'error');
      return;
    }

    // Verificar si hay cambios en el nombre
    const hasNameChanged = userData.nombre_completo !== userProfile?.nombre_completo;
    
    // Validación de contraseña si se intenta cambiar
    const wantsToChangePassword = userData.newPassword || userData.confirmPassword;
    
    if (wantsToChangePassword) {
      if (userData.newPassword.length < 6) {
        showCustomAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }

      if (userData.newPassword !== userData.confirmPassword) {
        showCustomAlert('Error', 'Las contraseñas nuevas no coinciden', 'error');
        return;
      }
    }

    // Si no hay cambios
    if (!hasNameChanged && !wantsToChangePassword) {
      showCustomAlert('Información', 'No hay cambios para guardar', 'info');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let updatePromises = [];

      // 1. Actualizar nombre en la tabla usuarios si cambió
      if (hasNameChanged) {
        const namePromise = supabase
          .from('usuarios')
          .update({
            nombre_completo: userData.nombre_completo
          })
          .eq('id', user.id);
        updatePromises.push(namePromise);
      }

      // 2. Actualizar contraseña si es necesario (NO ESPERAR RESPUESTA)
      if (wantsToChangePassword && userData.newPassword) {
        // Hacer la actualización de contraseña pero no esperar por ella
        supabase.auth.updateUser({
          password: userData.newPassword
        })
        .then(({ error }) => {
          if (error) {
            console.log('Error actualizando contraseña en background:', error.message);
          } else {
            console.log('Contraseña actualizada exitosamente en background');
          }
        })
        .catch(error => {
          console.log('Error en background task:', error);
        });
      }

      // Esperar solo por la actualización del nombre
      if (updatePromises.length > 0) {
        const results = await Promise.all(updatePromises);
        const hasErrors = results.some(result => result.error);
        
        if (hasErrors) {
          throw new Error('Error al actualizar el perfil');
        }
      }

      // Éxito inmediato - NO ESPERAR
      setSaving(false);
      showCustomAlert(
        '¡Éxito!', 
        wantsToChangePassword 
          ? 'Nombre actualizado exitosamente. La contraseña se está actualizando en segundo plano.' 
          : 'Perfil actualizado exitosamente',
        'success',
        () => {
          navigation.goBack();
        }
      );

    } catch (error) {
      console.error('Error:', error);
      setSaving(false);
      showCustomAlert('Error', 'No se pudieron guardar los cambios: ' + error.message, 'error');
    }
  };

  const handleCancel = () => {
    const hasChanges = 
      userData.nombre_completo !== userProfile?.nombre_completo ||
      userData.newPassword;

    if (hasChanges) {
      showCustomAlert(
        'Cancelar Cambios', 
        '¿Estás seguro de que quieres descartar los cambios?', 
        'warning',
        () => navigation.goBack()
      );
    } else {
      navigation.goBack();
    }
  };

  // Modal personalizado
  const CustomModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: modalData.type === 'error' ? '#8B0000' : 
                            modalData.type === 'warning' ? '#8B7500' : 
                            modalData.type === 'info' ? '#1E3A8A' : '#006400',
            borderColor: modalData.type === 'error' ? '#FF6B6B' : 
                        modalData.type === 'warning' ? '#FFD700' : 
                        modalData.type === 'info' ? '#60A5FA' : '#32CD32'
          }
        ]}>
          <View style={styles.modalHeader}>
            <Ionicons 
              name={
                modalData.type === 'error' ? 'close-circle' : 
                modalData.type === 'warning' ? 'warning' : 
                modalData.type === 'info' ? 'information-circle' : 'checkmark-circle'
              } 
              size={50} 
              color="#FFD700" 
            />
            <Text style={styles.modalTitle}>{modalData.title}</Text>
          </View>
          
          <Text style={styles.modalMessage}>{modalData.message}</Text>
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.modalButton,
                modalData.type === 'success' ? styles.modalButtonSuccess :
                modalData.type === 'warning' ? styles.modalButtonWarning :
                modalData.type === 'info' ? styles.modalButtonInfo :
                styles.modalButtonError
              ]}
              onPress={() => {
                setModalVisible(false);
                if (modalData.onConfirm) {
                  modalData.onConfirm();
                }
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={userData.nombre_completo}
              onChangeText={(text) => setUserData({...userData, nombre_completo: text})}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#888"
            />
          </View>

          {/* Email (solo lectura) */}
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Correo Electrónico</Text>
            <Text style={styles.readOnlyValue}>{userProfile?.email || 'No disponible'}</Text>
          </View>
        </View>

        {/* Cambio de Contraseña */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
          <Text style={styles.sectionSubtitle}>
            Deja estos campos vacíos si no quieres cambiar tu contraseña
          </Text>

          {/* Nueva Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={userData.newPassword}
                onChangeText={(text) => setUserData({...userData, newPassword: text})}
                placeholder="Ingresa nueva contraseña (mínimo 6 caracteres)"
                placeholderTextColor="#888"
                secureTextEntry={!showNewPassword}
                autoCorrect={false}
                spellCheck={false}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={userData.confirmPassword}
                onChangeText={(text) => setUserData({...userData, confirmPassword: text})}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                autoCorrect={false}
                spellCheck={false}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Información de la Cuenta (solo lectura) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>ID del Casino</Text>
            <Text style={styles.readOnlyValue}>{userProfile?.casino_id || 'No asignado'}</Text>
          </View>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Maneki Coins</Text>
            <Text style={styles.coinsValue}>
              {userCoins?.maneki_coins ? userCoins.maneki_coins.toLocaleString() : '0'}
            </Text>
          </View>

          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Tickets</Text>
            <Text style={styles.ticketsValue}>
              {userCoins?.tickets ? userCoins.tickets.toLocaleString() : '0'}
            </Text>
          </View>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Miembro desde</Text>
            <Text style={styles.readOnlyValue}>
              {userProfile?.fecha_creacion ? new Date(userProfile.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, saving && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Espacio al final para mejor scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal personalizado */}
      <CustomModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B0000',
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#800000',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#800000',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 15,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  readOnlyContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#8B0000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  readOnlyLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  readOnlyValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  coinsValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketsValue: {
    color: '#32CD32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#8B0000',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#B22222',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  saveButtonDisabled: {
    backgroundColor: '#228B22',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  // Estilos para el modal personalizado
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: '#006400',
  },
  modalButtonWarning: {
    backgroundColor: '#8B7500',
  },
  modalButtonInfo: {
    backgroundColor: '#1E3A8A',
  },
  modalButtonError: {
    backgroundColor: '#8B0000',
  },
  modalButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});