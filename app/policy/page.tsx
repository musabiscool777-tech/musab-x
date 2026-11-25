import type {Metadata} from 'next';

export const metadata:Metadata={title:'Browsing policy · Atom'};

export default function PolicyPage(){
 return <main className="policyPage">
  <article>
   <a className="policyBack" href="/">← Back to Atom</a>
   <h1>Browsing policy</h1>
   <p>You can use Atom as a guest on supported networks. Signing in lets you sync your workspace across devices.</p>
   <h2>Using the browser</h2>
   <p>Use Atom to visit sites you have permission to access. Follow the rules of your network and the sites you visit. Attempts to break into accounts, disrupt services, evade access restrictions, or use the relay for automated abuse are prohibited.</p>
   <h2>Network access</h2>
   <p>Atom checks the connecting IP address against a public proxy list and checks the network operator for school or university identifiers. Matching connections can be blocked before the homepage loads. A shared network can affect everyone using the same public address.</p>
   <p>Connection limits apply to guests and signed-in accounts. If you reach a limit, wait before trying again.</p>
   <h2>Your workspace</h2>
   <p>As a guest, your bookmarks, shortcuts, notes, preferences, and saved history stay in this browser. When signed in, Atom stores your workspace with your account. Open tabs are saved in the current browser.</p>
   <p>To stop recording new visits, turn off <strong>Save browsing history</strong> in Settings. To remove existing entries, open History from the page actions menu and choose <strong>Clear history</strong>.</p>
   <h2>Searches and websites</h2>
   <p>Scramjet loads websites through Atom’s relay. Your selected search engine receives the terms you submit. Destination sites can receive your browser’s user-agent and supported device hints. Their cookies and sign-ins are separate from your regular browser sessions.</p>
  </article>
 </main>;
}
