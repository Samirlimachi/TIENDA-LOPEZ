import { Dimensions, PixelRatio } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

export const GRID_COLUMNS = isTablet ? 3 : 2;

export const scaleH = (size: number) => scale(size);
export const scaleV = (size: number) => verticalScale(size);
export const scaleFontSize = (size: number) =>
  moderateScale(size, isTablet ? 0.3 : 0.5);

export const widthPercent = (percent: number) => wp(`${percent}%`);
export const heightPercent = (percent: number) => hp(`${percent}%`);

export const SPACING = {
  xs: scaleH(4),
  sm: scaleH(8),
  md: scaleH(16),
  lg: scaleH(24),
  xl: scaleH(32),
};

export const pixelRatio = PixelRatio.get();

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
