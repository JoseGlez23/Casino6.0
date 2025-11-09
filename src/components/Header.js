import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Header({ title }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
  },
  title: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
  },
});