// components/ExitConfirmationModal.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExitConfirmationModal = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Ionicons name="exit-outline" size={50} color="#FFD700" />
            <Text style={styles.modalTitle}>¿Salir de MANEKI CASINO?</Text>
          </View>
          
          <Text style={styles.modalMessage}>
            ¿Estás seguro de que quieres salir de la aplicación? 
            Podrías perder tu progreso en los juegos en curso.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Ionicons name="exit" size={20} color="#000" />
              <Text style={styles.confirmButtonText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 25,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
    borderWidth: 2,
  },
  cancelButton: {
    borderColor: '#FF6B6B',
    backgroundColor: 'transparent',
  },
  confirmButton: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ExitConfirmationModal;