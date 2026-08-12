import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@navigation/index';
import { AuthProvider } from '@context/AuthContext';
import { ConfirmDialogProvider } from '@context/ConfirmDialogContext';
import { CartProvider } from '@context/CartContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ConfirmDialogProvider>
        <AuthProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </AuthProvider>
      </ConfirmDialogProvider>
    </SafeAreaProvider>
  );
}

export default App;
