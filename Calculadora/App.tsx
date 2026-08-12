import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Currency = 'USD' | 'BOB' | 'BRL';

const SECRET_TAPS_TO_OPEN_SETTINGS = 6;
const SETTINGS_STORAGE_KEY = '@calculadora_settings';

const CURRENCY_LABEL: Record<Currency, string> = {
  USD: 'Código',
  BOB: 'Bolivianos',
  BRL: 'Reales',
};

const CURRENCY_PREFIX: Record<Currency, string> = {
  USD: '',
  BOB: 'Bs.',
  BRL: 'R$',
};

const formatAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return String(Number(value.toFixed(2)));
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  // code siempre almacena el número tal como se escribió; los botones de moneda
  // nunca lo modifican, solo cambian qué se muestra (currency).
  const [code, setCode] = useState('0');
  const [currency, setCurrency] = useState<Currency>('USD');

  const [bobMultiplier, setBobMultiplier] = useState(2);
  const [brlDivisor, setBrlDivisor] = useState(1.78);
  const [realesIncrement, setRealesIncrement] = useState(3);

  const [acTapCount, setAcTapCount] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [bobMultiplierText, setBobMultiplierText] = useState(String(bobMultiplier));
  const [brlDivisorText, setBrlDivisorText] = useState(String(brlDivisor));
  const [realesIncrementText, setRealesIncrementText] = useState(String(realesIncrement));

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then(stored => {
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (Number.isFinite(parsed.bobMultiplier)) {
          setBobMultiplier(parsed.bobMultiplier);
        }
        if (Number.isFinite(parsed.brlDivisor)) {
          setBrlDivisor(parsed.brlDivisor);
        }
        if (Number.isFinite(parsed.realesIncrement)) {
          setRealesIncrement(parsed.realesIncrement);
        }
      } catch {
        // Ignora datos guardados corruptos y se queda con los valores por defecto.
      }
    });
  }, []);

  const resetAcTapCount = () => {
    if (acTapCount !== 0) {
      setAcTapCount(0);
    }
  };

  const inputDigit = (digit: string) => {
    resetAcTapCount();
    if (currency !== 'USD') {
      setCode(digit);
      setCurrency('USD');
    } else {
      setCode(code === '0' ? digit : code + digit);
    }
  };

  const inputDecimal = () => {
    resetAcTapCount();
    if (currency !== 'USD') {
      setCode('0.');
      setCurrency('USD');
      return;
    }
    if (!code.includes('.')) {
      setCode(code + '.');
    }
  };

  const clearAll = () => {
    setCode('0');
    setCurrency('USD');
    setAcTapCount(current => {
      const next = current + 1;
      if (next >= SECRET_TAPS_TO_OPEN_SETTINGS) {
        setBobMultiplierText(String(bobMultiplier));
        setBrlDivisorText(String(brlDivisor));
        setRealesIncrementText(String(realesIncrement));
        setSettingsVisible(true);
        return 0;
      }
      return next;
    });
  };

  const backspace = () => {
    resetAcTapCount();
    setCurrency('USD');
    setCode(current => (current.length > 1 ? current.slice(0, -1) : '0'));
  };

  const convertTo = (target: Currency) => {
    resetAcTapCount();
    setCurrency(target);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
  };

  const saveSettings = () => {
    const parsedBob = Number.isFinite(parseFloat(bobMultiplierText)) && parseFloat(bobMultiplierText) > 0
      ? parseFloat(bobMultiplierText)
      : bobMultiplier;
    const parsedBrl = Number.isFinite(parseFloat(brlDivisorText)) && parseFloat(brlDivisorText) > 0
      ? parseFloat(brlDivisorText)
      : brlDivisor;
    const parsedIncrement = Number.isFinite(parseFloat(realesIncrementText))
      ? parseFloat(realesIncrementText)
      : realesIncrement;

    setBobMultiplier(parsedBob);
    setBrlDivisor(parsedBrl);
    setRealesIncrement(parsedIncrement);

    AsyncStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        bobMultiplier: parsedBob,
        brlDivisor: parsedBrl,
        realesIncrement: parsedIncrement,
      }),
    );

    setSettingsVisible(false);
  };

  const codeValue = parseFloat(code) || 0;
  // Reales = código / divisor, redondeado al entero más cercano y sumándole el incremento.
  // Bolivianos = ese mismo valor exacto de Reales x multiplicador, redondeado al entero más cercano.
  const reales = codeValue / brlDivisor;
  const realesRedondeado = Math.round(reales) + realesIncrement;
  const bolivianosRedondeado = Math.round(reales * bobMultiplier);

  const display =
    currency === 'USD'
      ? code
      : formatAmount(currency === 'BOB' ? bolivianosRedondeado : realesRedondeado);

  const digitButtons: Array<{ label: string; onPress: () => void }> = [
    { label: '7', onPress: () => inputDigit('7') },
    { label: '8', onPress: () => inputDigit('8') },
    { label: '9', onPress: () => inputDigit('9') },
    { label: '4', onPress: () => inputDigit('4') },
    { label: '5', onPress: () => inputDigit('5') },
    { label: '6', onPress: () => inputDigit('6') },
    { label: '1', onPress: () => inputDigit('1') },
    { label: '2', onPress: () => inputDigit('2') },
    { label: '3', onPress: () => inputDigit('3') },
  ];

  return (
    <SafeAreaProvider>
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.displayContainer}>
        <Text style={styles.currencyLabel}>{CURRENCY_LABEL[currency]}</Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {CURRENCY_PREFIX[currency] ? `${CURRENCY_PREFIX[currency]} ${display}` : display}
        </Text>
      </View>
      <View style={styles.keypad}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={clearAll}
            style={[styles.button, styles.buttonHalf, styles.buttonFunction]}
          >
            <Text style={[styles.buttonText, styles.buttonTextFunction]}>AC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={backspace}
            style={[styles.button, styles.buttonHalf, styles.buttonFunction]}
          >
            <Text style={[styles.buttonText, styles.buttonTextFunction]}>⌫</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => convertTo('BOB')}
            style={[styles.button, styles.buttonHalf, styles.buttonBob]}
          >
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              Bs. Bolivianos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => convertTo('BRL')}
            style={[styles.button, styles.buttonHalf, styles.buttonBrl]}
          >
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              R$ Reales
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          {digitButtons.slice(0, 3).map(button => (
            <TouchableOpacity
              key={button.label}
              onPress={button.onPress}
              style={[styles.button, styles.buttonThird]}
            >
              <Text style={styles.buttonText}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {digitButtons.slice(3, 6).map(button => (
            <TouchableOpacity
              key={button.label}
              onPress={button.onPress}
              style={[styles.button, styles.buttonThird]}
            >
              <Text style={styles.buttonText}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {digitButtons.slice(6, 9).map(button => (
            <TouchableOpacity
              key={button.label}
              onPress={button.onPress}
              style={[styles.button, styles.buttonThird]}
            >
              <Text style={styles.buttonText}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => inputDigit('0')}
            style={[styles.button, styles.buttonTwoThirds]}
          >
            <Text style={styles.buttonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={inputDecimal} style={[styles.button, styles.buttonThird]}>
            <Text style={styles.buttonText}>.</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSettings}
      >
        <SafeAreaView style={styles.settingsSafeArea}>
          <KeyboardAvoidingView
            style={styles.settingsContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Text style={styles.settingsTitle}>Configuración</Text>

            <Text style={styles.settingsLabel}>Multiplicador de Bolivianos</Text>
            <TextInput
              style={styles.settingsInput}
              keyboardType="decimal-pad"
              value={bobMultiplierText}
              onChangeText={setBobMultiplierText}
              placeholder="2"
              placeholderTextColor="#777777"
            />

            <Text style={styles.settingsLabel}>Divisor de Reales</Text>
            <TextInput
              style={styles.settingsInput}
              keyboardType="decimal-pad"
              value={brlDivisorText}
              onChangeText={setBrlDivisorText}
              placeholder="1.78"
              placeholderTextColor="#777777"
            />

            <Text style={styles.settingsLabel}>Aumento sobre Reales (redondeado)</Text>
            <TextInput
              style={styles.settingsInput}
              keyboardType="numbers-and-punctuation"
              value={realesIncrementText}
              onChangeText={setRealesIncrementText}
              placeholder="3"
              placeholderTextColor="#777777"
            />

            <TouchableOpacity
              onPress={saveSettings}
              style={[styles.settingsButton, styles.settingsSaveButton]}
            >
              <Text style={styles.settingsButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeSettings}
              style={[styles.settingsButton, styles.settingsCancelButton]}
            >
              <Text style={styles.settingsButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
  },
  safeAreaDark: {
    backgroundColor: '#000000',
  },
  displayContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'flex-end',
  },
  currencyLabel: {
    color: '#A5A5A5',
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 4,
  },
  displayText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '300',
  },
  keypad: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    height: 72,
    margin: '1.5%',
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonThird: {
    flex: 1,
  },
  buttonTwoThirds: {
    flex: 2,
    alignItems: 'flex-start',
    paddingLeft: 28,
  },
  buttonFunction: {
    backgroundColor: '#A5A5A5',
  },
  buttonBob: {
    backgroundColor: '#2E7D32',
  },
  buttonBrl: {
    backgroundColor: '#1565C0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
  },
  buttonTextLight: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextFunction: {
    color: '#000000',
  },
  settingsSafeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  settingsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  settingsLabel: {
    color: '#A5A5A5',
    fontSize: 16,
    marginBottom: 8,
  },
  settingsInput: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    fontSize: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  settingsButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsSaveButton: {
    backgroundColor: '#2E7D32',
  },
  settingsCancelButton: {
    backgroundColor: '#A5A5A5',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default App;
