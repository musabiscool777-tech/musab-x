import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Atom',description:'A study workspace with a tabbed web browser. Search the web, explore with tabs, and save your discoveries.',icons:{icon:'/atom-planet.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
