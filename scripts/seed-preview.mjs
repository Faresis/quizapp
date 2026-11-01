// Disposable local QA accounts only; never part of production initialization.
import {DatabaseSync} from 'node:sqlite';
import {hashPassword} from '../server/api.mjs';
const db=new DatabaseSync('work/preview.sqlite');
for(const [id,username,name,role,parent] of [['admin','admin','Administrator','admin',null],['qa-parent','qaparent','QA Parent','parent',null],['qa-child','qachild','QA Child','child','qa-parent']])db.prepare('INSERT OR IGNORE INTO users (id,username,name,role,parent_id,password_hash,must_change,created_at) VALUES (?,?,?,?,?,?,0,?)').run(id,username,name,role,parent,await hashPassword('LocalPreview123!'),Date.now());
console.log('Local-only QA accounts are ready.');
