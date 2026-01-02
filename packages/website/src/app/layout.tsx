import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import './globals.css'
import type { FC, ReactNode } from 'react';

export const metadata = {
  metadataBase: new URL('https://react-docgen.dev'),
  alternates: {
    canonical: './', // note this is ./, not / !!!
  },
  title: {
    default: 'react-docgen – React documentation generator',
    template: '%s \u2013 react-docgen',
  },
  openGraph: {
    url: 'https://react-docgen.dev',
    siteName: 'react-docgen',
    locale: 'en_US',
    type: 'website',
  },
};

//const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const navbar = (
  <Navbar
    logo={<span className="text-lg font-bold">react-docgen</span>}
    projectLink="https://github.com/reactjs/react-docgen"
  />
);
const footer = <Footer className="flex-col items-center md:items-start">
    <p className="mt-6 text-xs">
      MIT License | © {new Date().getFullYear()} react-docgen.
    </p>
  </Footer>;

const RootLayout: FC<{
  children: ReactNode;
}> = async ({ children }) => {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          //banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/reactjs/react-docgen/tree/main/packages/website"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
};

export default RootLayout;
