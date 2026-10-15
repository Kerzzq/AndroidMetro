const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const scripts = readdirSync(__dirname).filter(name => /^test-.+\.cjs$/.test(name)).sort();
for (const script of scripts) {
  const result = spawnSync(process.execPath, [join(__dirname, script)], {stdio:'inherit',cwd:join(__dirname,'..')});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`PASS: ${scripts.length} test suites.`);
