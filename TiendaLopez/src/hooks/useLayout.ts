import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { GRID_COLUMNS } from '@constants/dimensions';

export const useResponsive = () => {
  // Usamos 'screen' (no 'window'): en Android, 'window' se achica cuando aparece
  // el teclado (windowSoftInputMode="adjustResize"), lo que dispara este listener
  // y re-renderiza toda la pantalla justo cuando el usuario toca un buscador,
  // haciendo que pierda el foco. 'screen' no cambia con el teclado.
  const [screen, setScreen] = useState<ScaledSize>(Dimensions.get('screen'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen: nextScreen }) => {
      setScreen(nextScreen);
    });
    return () => subscription.remove();
  }, []);

  const isTablet = Math.min(screen.width, screen.height) >= 600;
  const isLandscape = screen.width > screen.height;

  return {
    width: screen.width,
    height: screen.height,
    isTablet,
    isLandscape,
    gridColumns: isTablet ? 3 : GRID_COLUMNS,
  };
};
