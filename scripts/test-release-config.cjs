const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { hardenManifest, disableTemplateReleaseSigning } = require('../plugins/withReleaseSafety');
const config = require('../app.json').expo;
assert.equal(config.android.package,'com.metrobilbao.widget');
assert.equal(config.version,'2.0.0');
for (const name of ['READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','SYSTEM_ALERT_WINDOW','VIBRATE']) assert.ok(config.android.blockedPermissions.includes(`android.permission.${name}`));
const manifest={manifest:{application:[{$:{}}]}};
assert.equal(hardenManifest(manifest).manifest.application[0].$['android:usesCleartextTraffic'],'false');
const template='debug { signingConfig signingConfigs.debug }\nrelease {\n // Caution! In production\n signingConfig signingConfigs.debug\n}';
const safe=disableTemplateReleaseSigning(template);
assert.ok(safe.includes('debug { signingConfig signingConfigs.debug }'));
assert.ok(safe.includes('signingConfig null'));
assert.equal(disableTemplateReleaseSigning(safe),safe);
assert.throws(()=>disableTemplateReleaseSigning('changed upstream'),/Unrecognized/);
if(fs.existsSync(path.join(__dirname,'../android/app/build.gradle'))){
  const gradle=fs.readFileSync(path.join(__dirname,'../android/app/build.gradle'),'utf8');
  if(gradle.includes("applicationId 'com.metrobilbao.widget'")) assert.ok(gradle.includes('signingConfig null'),'Regenerate production Android after changing plugins');
}
console.log('PASS: production identity, unnecessary permissions blocked, explicit HTTPS policy and no implicit debug release signing.');
