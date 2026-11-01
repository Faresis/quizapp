import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import worker from '../dist/server/index.js';
mkdirSync('work',{recursive:true});const sql=new DatabaseSync('work/preview.sqlite');sql.exec('PRAGMA foreign_keys=ON');
if(!sql.prepare("SELECT name FROM sqlite_master WHERE name='users'").get())sql.exec(readFileSync('drizzle/0000_accounts.sql','utf8'));
if(!sql.prepare("SELECT name FROM sqlite_master WHERE name='focus_sessions'").get())sql.exec(readFileSync('drizzle/0001_focus_coaching.sql','utf8'));
import {d1} from './d1-test-adapter.mjs';
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);headers.set('oai-authenticated-user-id','local-preview-owner');const r=await worker.fetch(new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers,body:body.length?body:undefined}),{DB:d1(sql)});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch(e){console.error(e);res.writeHead(500);res.end('Preview error')}});server.listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173'));
