import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Camera } from 'react-native-camera-kit';
import { Colors, Typography } from '@theme/index';
import { SPACING } from '@constants/dimensions';

type OnReadCodeData = { nativeEvent: { codeStringValue: string } };

export const BarcodeScannerScreen = ({ navigation, route }: any) => {
  const onScanned = route.params?.onScanned as ((code: string) => void) | undefined;
  const [handled, setHandled] = useState(false);

  // onReadCode sigue disparando mientras el código está en cuadro; sin esta guarda
  // se llamaría onScanned (y goBack) varias veces por el mismo escaneo.
  const handledRef = useRef(false);

  const handleReadCode = useCallback(
    (event: OnReadCodeData) => {
      if (handledRef.current) {
        return;
      }
      handledRef.current = true;
      setHandled(true);
      const value = event.nativeEvent.codeStringValue;
      // Cerrar el escáner antes de disparar el callback: si onScanned navega a otra
      // pantalla (ej. abrir el producto), ese goBack() debe sacar al escáner del
      // stack, no a la pantalla recién abierta por el callback.
      navigation.goBack();
      onScanned?.(value);
    },
    [navigation, onScanned],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear código</Text>
        <View style={{ width: 40 }} />
      </View>

      {!handled && (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={'back' as any}
          scanBarcode
          onReadCode={handleReadCode}
          showFrame
          laserColor={Colors.secondary}
          frameColor={Colors.white}
        />
      )}

      <View style={styles.hintBox}>
        <Text style={styles.hintText}>Apuntá al código de barras del producto</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  hintBox: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  hintText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
