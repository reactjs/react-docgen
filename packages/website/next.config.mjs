import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './src/theme.config.tsx',
});

export default withNextra({
  webpack: (config) => {
    if (!config.resolve.fallback) config.resolve.fallback = {};

    config.resolve.fallback.fs = false;
    config.resolve.aliasFields = ['browser'];

    return config;
  },
});
