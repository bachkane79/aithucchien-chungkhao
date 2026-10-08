const fs = require('fs');
const path = require('path');
const app = path.resolve('chung-khao/mapstudy-stem');
const catalog = JSON.parse(fs.readFileSync(path.join(app,'src/lib/phet-catalog.json'),'utf8'));
const sorted = [...catalog].sort((a,b)=>a.slug.localeCompare(b.slug));
const output = path.join(app,'src/lib/understanding-quizzes');
fs.mkdirSync(output,{recursive:true});
fs.mkdirSync('.tools/quiz-references',{recursive:true});
for (let i=0;i<8;i++) {
 const chunk = sorted.slice(i*16,(i+1)*16);
 const records = chunk.map(sim => {
  const html = fs.readFileSync(path.join(app,'public/simulators/phet',sim.slug,'index.html'),'utf8');
  const markers = ['chipper.strings', 'chipper.locale', '"vi":', '"en":'];
  const matches = markers.map(marker => { const index=html.indexOf(marker); return index < 0 ? '' : html.slice(Math.max(0,index-30),index+1500); }).filter(Boolean);
  const assignment=html.indexOf('window.phet.chipper.strings = ');
  let texts={};
  if (assignment>=0) {
   const start=html.indexOf('{',assignment); let depth=0,quoted=false,escaped=false,end=start;
   for (;end<html.length;end++) { const c=html[end]; if(quoted){if(escaped){escaped=false;}else if(c==='\\'){escaped=true;}else if(c==='"'){quoted=false;}}else if(c==='"'){quoted=true;}else if(c==='{'){depth++;}else if(c==='}' && --depth===0){end++;break;} }
   let all;
   try { all=JSON.parse(html.slice(start,end)); } catch {
    const expression=html.slice(assignment+'window.phet.chipper.strings = '.length).split('\n')[0].replace(/;\s*$/,'');
    fs.writeFileSync(`.tools/quiz-references/${sim.slug}-string-format.txt`,expression.slice(0,2400));
    all=require('vm').runInNewContext(expression,{}, {timeout:2000});
   }
   const local=all.vi ?? all.en ?? {};
   texts=Object.fromEntries(Object.entries(local).filter(([key])=> !/^(JOIST|SCENERY_PHET|SUN|TAMBO|SCENERY|KITE|DOT|AXON|UTTERANCE_QUEUE|TANDEM)\//.test(key)).map(([key,value])=>[key,String(value).replace(/[\u202a-\u202e\u2066-\u2069]/g,'')]));
  }
  const reference={slug:sim.slug,title:sim.title,englishTitle:sim.englishTitle,subjects:sim.subjects,sourcePage:sim.localizedSourcePage ?? sim.sourcePage,controls:texts};
  fs.writeFileSync(`.tools/quiz-references/${sim.slug}.json`,JSON.stringify(reference,null,2));
  return {slug:sim.slug,title:sim.title,englishTitle:sim.englishTitle,subjects:sim.subjects,sourcePage:sim.localizedSourcePage ?? sim.sourcePage,referenceFile:`.tools/quiz-references/${sim.slug}.json`,controlCount:Object.keys(texts).length};
 });
 fs.writeFileSync(`.tools/quiz-references/batch-${i+1}.json`,JSON.stringify(records,null,2));
 console.log(`batch-${i+1}: ${chunk.length} sims: ${chunk.map(s=>s.slug).join(', ')}`);
}
const first = fs.readFileSync(path.join(app,'public/simulators/phet/pendulum-lab/index.html'),'utf8');
const m = first.match(/.{0,100}chipper\.strings.{0,400}/);
console.log('STRING FORMAT:',m?.[0]);
