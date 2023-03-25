const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './src/theme.config.tsx',
});

module.exports = withNextra({
  webpack: (config) => {
    if (!config.resolve.fallback) config.resolve.fallback = {};

    config.resolve.fallback.fs = false;

    return config;
  },
});
