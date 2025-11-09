import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function Button({ title, onPress, style, disabled = false }) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        style, 
        disabled && styles.buttonDisabled
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        disabled && styles.buttonTextDisabled
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextDisabled: {
    color: "#999",
  },
});