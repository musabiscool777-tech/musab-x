import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'musab-x study',description:'Your personal web workspace. Search the web, explore with tabs, and save your discoveries.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
