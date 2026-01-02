import nextra from 'nextra';

const withNextra = nextra({});

export default withNextra({
  webpack: (config) => {
    if (!config.resolve.fallback) config.resolve.fallback = {};

    config.resolve.fallback.fs = false;
    config.resolve.aliasFields = ['browser'];

    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: {
        browser: './src/empty.ts',
      },
      '@babel/preset-typescript/package.json': './src/empty.ts',
      'next-mdx-import-source-file': './src/mdx-components.tsx',
    },
  },
});
