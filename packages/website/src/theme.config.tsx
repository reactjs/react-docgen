import React from 'react';
import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';
import { useConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span className="text-lg font-bold">react-docgen</span>,
  project: {
    link: 'https://github.com/reactjs/react-docgen',
  },
  docsRepositoryBase:
    'https://github.com/reactjs/react-docgen/tree/main/packages/website',
  footer: {
    content: '',
  },
  head() {
    const { frontMatter, title } = useConfig();
    const { route } = useRouter();

    const description =
      frontMatter.description || 'Make beautiful websites with Next.js & MDX.';
    const pageTitle = title + (route === '/' ? '' : ' \u2013 react-docgen');

    return (
      <>
        <title>{pageTitle}</title>
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
      </>
    );
  },
};

export default config;
