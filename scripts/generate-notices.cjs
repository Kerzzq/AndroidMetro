// Reproduce after npm ci. Include the complete locked npm tree conservatively,
// even packages used only by tooling, rather than guessing bundle membership.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const lock = JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const groups = new Map(), missing = [], inventory = [];
for(const [relative,locked] of Object.entries(lock.packages)) {
  if(!relative) continue;
  const folder=path.join(root,relative);
  if(!fs.existsSync(folder)) { if(!locked.optional) throw Error(`Missing package: ${relative}`); continue; }
  const pkg=JSON.parse(fs.readFileSync(path.join(folder,'package.json'),'utf8'));
  const files=fs.readdirSync(folder).filter(name=>/^(?:licen[cs]e|copying|notice)(?:[.\-_].*)?$/i.test(name) && fs.statSync(path.join(folder,name)).isFile());
  const texts=files.map(file=>fs.readFileSync(path.join(folder,file),'utf8').trim()).filter(Boolean);
  const id=`${pkg.name}@${pkg.version}`;
  inventory.push({name:pkg.name,version:pkg.version,license:pkg.license||'UNSPECIFIED',files});
  if(!texts.length) {missing.push(id);continue;}
  const text=texts.join('\n\n');
  const group=groups.get(text)||new Set();group.add(id);groups.set(text,group);
}
const output=[
  'AndroidMetro — third-party notices',
  'Generated from package-lock.json and the installed npm package license/notice files.',
  'This includes build-time packages as well as application dependencies. Inclusion does not imply every listed package executes in the APK.',
  'No license for AndroidMetro-owned code is granted by this document. Third-party terms below remain applicable.',
  ...[...groups].map(([text,packages])=>'='.repeat(72)+'\n'+[...packages].sort().join('\n')+'\n\n'+text),
  ...(missing.length?['='.repeat(72)+'\nPackages without a root license/notice file in the installed distribution; see their package metadata and upstream terms:\n'+missing.sort().join('\n')]:[]),
].join('\n\n')+'\n';
fs.writeFileSync(path.join(root,'THIRD_PARTY_NOTICES.txt'),output);
if(process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify({packages:inventory,missingRootNotice:missing},null,2));
console.log(`Notices: ${inventory.length} installed packages, ${groups.size} unique text groups; ${missing.length} without root license/notice files.`);
if(missing.length)console.log(missing.join('\n'));
