const { withAndroidManifest, withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const GRADLE_ZIP_SHA256 = '8fad3d78296ca518113f3d29016617c7f9367dc005f932bd9d93bf45ba46072b';
const GRADLE_WRAPPER_SHA256 = '76805e32c009c0cf0dd5d206bddc9fb22ea42e84db904b764f3047de095493f3';

function hardenManifest(manifest) {
  const app = manifest.manifest.application[0];
  app.$['android:usesCleartextTraffic'] = 'false';
  return manifest;
}
function disableTemplateReleaseSigning(contents) {
  const pattern = /(release\s*\{\s*\/\/ Caution![\s\S]*?)signingConfig signingConfigs\.debug/;
  if (contents.includes('// AndroidMetro: unsigned until explicitly signed with the verified original key.')) return contents;
  if (!pattern.test(contents)) throw new Error('Unrecognized Expo release signing template; audit before building.');
  return contents.replace(pattern, '$1// AndroidMetro: unsigned until explicitly signed with the verified original key.\n            signingConfig null');
}
module.exports = function withReleaseSafety(config) {
  config = withAndroidManifest(config, mod => { mod.modResults = hardenManifest(mod.modResults); return mod; });
  if (config.android?.package === 'com.metrobilbao.widget') {
    config = withAppBuildGradle(config, mod => {
      if (mod.modResults.language !== 'groovy') throw new Error('Expected audited Groovy Gradle template.');
      mod.modResults.contents = disableTemplateReleaseSigning(mod.modResults.contents);
      return mod;
    });
  }
  return withDangerousMod(config, ['android', async mod => {
    // Checksums published at services.gradle.org/distributions/ for Gradle9.0.0.
    // Fail on upstream template changes rather than pinning the wrong archive.
    const wrapper = path.join(mod.modRequest.platformProjectRoot, 'gradle/wrapper');
    const propertiesFile = path.join(wrapper, 'gradle-wrapper.properties');
    let properties = fs.readFileSync(propertiesFile, 'utf8');
    if (!properties.includes('gradle-9.0.0-bin.zip')) throw new Error('Gradle version changed; audit its checksums.');
    const jarHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(wrapper, 'gradle-wrapper.jar'))).digest('hex');
    if (jarHash !== GRADLE_WRAPPER_SHA256) throw new Error('Gradle wrapper JAR checksum mismatch.');
    properties = properties.replace(/^distributionSha256Sum=.*\r?\n?/m, '');
    fs.writeFileSync(propertiesFile, properties.trimEnd() + '\ndistributionSha256Sum=' + GRADLE_ZIP_SHA256 + '\n');
    const source = path.join(mod.modRequest.projectRoot, 'THIRD_PARTY_NOTICES.txt');
    if (fs.existsSync(source)) {
      const assets = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/assets');
      fs.mkdirSync(assets, { recursive: true });
      fs.copyFileSync(source, path.join(assets, 'THIRD_PARTY_NOTICES.txt'));
    }
    return mod;
  }]);
};
module.exports.hardenManifest = hardenManifest;
module.exports.disableTemplateReleaseSigning = disableTemplateReleaseSigning;
