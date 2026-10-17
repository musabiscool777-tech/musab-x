export const themeIds = ['dark','light','midnight','ocean','forest','dusk','rose','sand'] as const;
export const themes = [
  {id:'dark',name:'Graphite',description:'The original, refined.',background:'#111416',surface:'#202629',accent:'#cee9a2',dark:true},
  {id:'light',name:'Paper',description:'A little room to breathe.',background:'#f7f8f3',surface:'#ffffff',accent:'#527128',dark:false},
  {id:'midnight',name:'Midnight',description:'Quiet after hours.',background:'#0d1222',surface:'#1d2942',accent:'#a9bfff',dark:true},
  {id:'ocean',name:'Ocean',description:'Clear skies, open water.',background:'#0b1c25',surface:'#173540',accent:'#82d9e8',dark:true},
  {id:'forest',name:'Forest',description:'A calmer kind of focus.',background:'#111e19',surface:'#253b2e',accent:'#b3d69a',dark:true},
  {id:'dusk',name:'Dusk',description:'Soft violet, fresh ideas.',background:'#1b1626',surface:'#352c45',accent:'#d2b8f5',dark:true},
  {id:'rose',name:'Rose',description:'Warmth in every detail.',background:'#fff5f5',surface:'#ffffff',accent:'#a13f64',dark:false},
  {id:'sand',name:'Sand',description:'Easy on the eyes.',background:'#f6f0e4',surface:'#fffcf5',accent:'#825b29',dark:false},
] as const;
