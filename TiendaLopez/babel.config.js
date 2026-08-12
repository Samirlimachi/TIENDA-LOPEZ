module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.ts', '.tsx'],
        alias: {
          '@screens': './src/screens',
          '@components': './src/components',
          '@theme': './src/theme',
          '@constants': './src/constants',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@assets': './src/assets',
          '@utils': './src/utils',
          '@context': './src/context',
          '@services': './src/services',
          '@models': './src/types',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
