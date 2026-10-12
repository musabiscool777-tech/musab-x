import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Musab X — Stay curious',description:'Your personal web workspace. Search with Google, explore with tabs, and save your discoveries.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
