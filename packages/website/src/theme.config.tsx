import React from 'react';
import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';

const config: DocsThemeConfig = {
  logo: <span className="text-lg font-bold">react-docgen</span>,
  project: {
    link: 'https://github.com/reactjs/react-docgen',
  },
  docsRepositoryBase:
    'https://github.com/reactjs/react-docgen/tree/main/packages/website',
  footer: {
    text: '',
  },
  useNextSeoProps: () => {
    const { asPath } = useRouter();

    if (asPath !== '/') {
      return {
        titleTemplate: '%s \u2013 react-docgen',
      };
    } else {
      return {
        titleTemplate: 'react-docgen \u2013 React documentation generator',
      };
    }
  },
};

export default config;
