import type {Metadata} from 'next';

export const metadata:Metadata={title:'Study workspace policy · Atom'};

export default function PolicyPage(){
 return <main className="policyPage">
  <article>
   <a className="policyBack" href="/">← Back to Atom</a>
   <h1>Study workspace policy</h1>
   <p>Atom is a study workspace for asking homework questions, practicing concepts, and researching sources in its built-in browser. You can study as a guest on supported networks or sign in to sync your workspace.</p>
   <h2>Using AI for schoolwork</h2>
   <p>Use the tutor for hints, explanations, and feedback on your own attempts. Check its answers against your textbook or class notes, and follow your teacher’s rules about using and disclosing AI assistance.</p>
   <h2>Researching with Atom</h2>
   <p>Use Atom to visit sites you have permission to access. Follow the rules of your network and the sites you visit. Attempts to break into accounts, disrupt services, evade access restrictions, or use the relay for automated abuse are prohibited.</p>
   <h2>Network access</h2>
   <p>Atom checks the connecting IP address against a public proxy list and checks the network operator for school or university identifiers. Matching connections can be blocked before the homepage loads. A shared network can affect everyone using the same public address.</p>
   <p>Connection limits apply to guests and signed-in accounts. If you reach a limit, wait before trying again.</p>
   <h2>Your workspace</h2>
   <p>As a guest, your bookmarks, shortcuts, notes, preferences, and saved history stay in this browser. When signed in, Atom stores your workspace with your account. Open tabs are saved in the current browser.</p>
   <p>To stop recording new visits, turn off <strong>Save browsing history</strong> in Settings. To remove existing entries, open History from the page actions menu and choose <strong>Clear history</strong>.</p>
   <h2>Homework tutor</h2>
   <p>When you ask the tutor a question, Atom sends your question and recent conversation turns to Cloudflare Workers AI. Atom keeps the conversation in the open Study page. Leaving the page clears it.</p>
   <h2>Searches and websites</h2>
   <p>Scramjet loads websites through Atom’s relay. Your selected search engine receives the terms you submit. Destination sites can receive your browser’s user-agent and supported device hints. Their cookies and sign-ins are separate from your regular browser sessions.</p>
  </article>
 </main>;
}
