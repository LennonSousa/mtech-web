import type { AppProps } from 'next/app';
import Head from 'next/head';
import { NextSeo } from 'next-seo';

import { AuthProvider } from '../contexts/AuthContext';
import { StoresProvider } from '../contexts/StoresContext';
import { SideBarProvider } from '../contexts/SideBarContext';
import { Header } from '../components/PageHeader';
import Sidebar from '../components/Sidebar';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-print-css/css/bootstrap-print.min.css';
import '../styles/global.css';

import styles from '../styles/app.module.css';

function App({ Component, pageProps }: AppProps) {
  return <>
    <NextSeo titleTemplate="%s | Plataforma solar" defaultTitle="Plataforma de gerenciamento." />

    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>

    <StoresProvider>
      <AuthProvider>
        <SideBarProvider>
          <div className={styles.wrapper}>
            <Header />
            <div className={styles.main}>
              <Sidebar />

              <section className={styles.content}>
                <Component {...pageProps} />
              </section>
            </div>
          </div>
        </SideBarProvider>
      </AuthProvider>
    </StoresProvider>
  </>
}

export default App
