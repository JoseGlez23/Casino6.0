// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { CoinsProvider } from './src/context/CoinsContext';
import { AudioProvider } from './src/context/AudioContext';

export default function App() {
  return (
    <AudioProvider>
      <CoinsProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </CoinsProvider>
    </AudioProvider>
  );
}