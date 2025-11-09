import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { CoinsProvider } from './src/context/CoinsContext';

export default function App() {
  return (
    <CoinsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </CoinsProvider>
  );
}