import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@hooks/useLayout';
import { SPACING } from '@constants/dimensions';

type Props = {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
};

export const ResponsiveGrid = ({ children, columns, gap = SPACING.sm, style }: Props) => {
  const { gridColumns } = useResponsive();
  const cols = columns ?? gridColumns;
  const items = React.Children.toArray(children);

  return (
    <View style={[styles.container, { gap }, style]}>
      {items.map((child, index) => (
        <View key={index} style={{ width: `${100 / cols}%`, padding: gap / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
