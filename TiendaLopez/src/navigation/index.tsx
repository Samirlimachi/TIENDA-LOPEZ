import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@screens/LoginScreen';
import { RegisterScreen } from '@screens/RegisterScreen';
import { CatalogScreen } from '@screens/CatalogScreen';
import { ProductFormScreen } from '@screens/ProductFormScreen';
import { UsersScreen } from '@screens/UsersScreen';
import { ManageCatalogScreen } from '@screens/ManageCatalogScreen';
import { NewSaleScreen } from '@screens/NewSaleScreen';
import { SalesHistoryScreen } from '@screens/SalesHistoryScreen';
import { SaleDetailScreen } from '@screens/SaleDetailScreen';
import { CustomersScreen } from '@screens/CustomersScreen';
import { BarcodeScannerScreen } from '@screens/BarcodeScannerScreen';
import { ReportsScreen } from '@screens/ReportsScreen';
import { useAuth } from '@context/AuthContext';
import { Colors } from '@theme/index';
import { Customer, Product, Sale } from '@models/index';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Catalog: undefined;
  ProductForm: { product: Product | null };
  Users: undefined;
  ManageCatalog: undefined;
  NewSale: undefined;
  SalesHistory: undefined;
  SaleDetail: { sale: Sale };
  Customers: { onSave?: (customer: Customer) => void } | undefined;
  BarcodeScanner: { onScanned?: (code: string) => void } | undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, keyboardHandlingEnabled: false }}>
        {user ? (
          <>
            <Stack.Screen name="Catalog" component={CatalogScreen} />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Users" component={UsersScreen} />
            <Stack.Screen name="ManageCatalog" component={ManageCatalogScreen} />
            <Stack.Screen
              name="NewSale"
              component={NewSaleScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
            <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
            <Stack.Screen name="Customers" component={CustomersScreen} />
            <Stack.Screen
              name="BarcodeScanner"
              component={BarcodeScannerScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="Reports" component={ReportsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
