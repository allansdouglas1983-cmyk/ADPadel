module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inline Drizzle's `.sql` migration files as strings so Babel doesn't try
      // to parse SQL as JavaScript (pairs with metro sourceExts += 'sql').
      ['inline-import', { extensions: ['.sql'] }],
      // Reanimated's plugin must be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};
