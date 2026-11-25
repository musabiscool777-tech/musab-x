import {AstraView} from '../../components/study-view';

export const metadata={title:'Astra · Atom'};
export default function AstraPage(){
 return <main className="app dark standaloneStudy"><a href="/">← Atom home</a><AstraView/></main>;
}
