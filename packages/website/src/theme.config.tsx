import React from 'react';
import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span>react-docgen</span>,
  project: {
    link: 'https://github.com/reactjs/react-docgen',
  },
  docsRepositoryBase:
    'https://github.com/reactjs/react-docgen/tree/main/packages/website',
  footer: {
    text: '',
  },
  useNextSeoProps: () => ({ titleTemplate: '%s \u2013 react-docgen' }),
};

export default config;
