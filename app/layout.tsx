import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Musab X — Stay curious',description:'Your personal web workspace. Search the web, explore with tabs, and save your discoveries.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://production-sfo.browserless.io"/><link rel="dns-prefetch" href="https://production-sfo.browserless.io"/></head><body>{children}</body></html>}
