import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,join,relative} from 'node:path';
import {compileCatalog} from '../lib/catalog.mjs';
export async function loadCatalog(root=new URL('../content/',import.meta.url)){
 const path=typeof root==='string'?resolve(root):fileURLToPath(root),files=[];
 async function scan(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const p=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Content symlinks are not supported: '+p);
  if(entry.isDirectory())await scan(p);else if(entry.name.endsWith('.json')){let data;const raw=await readFile(p,'utf8');if(Buffer.byteLength(raw)>500000)throw Error(p+': content file exceeds 500 KB.');try{data=JSON.parse(raw)}catch(e){throw Error(p+': invalid JSON: '+e.message)}files.push({file:'content/'+relative(path,p).replaceAll('\\','/'),data});}
 }}
 await scan(path);return compileCatalog(files,s=>createHash('sha256').update(s).digest('hex'));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const catalog=await loadCatalog();console.log(`Content valid: ${catalog.tests.length} tests/exercises, ${catalog.sessions.length} sessions, ${catalog.courses.length} courses. Catalog ${catalog.fingerprint.slice(0,12)}`)}catch(e){console.error(e.message);process.exitCode=1}
}
