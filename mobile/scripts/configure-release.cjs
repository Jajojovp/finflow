const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '../android/app/build.gradle');
let text = fs.readFileSync(target, 'utf8');
if (!text.includes('signingConfigs {') || !text.includes('buildTypes {')) throw new Error('Unexpected Android build template');
if (!text.includes('FINFLOW_STORE_FILE')) {
  text = text.replace('signingConfigs {', `signingConfigs {
        finflowRelease {
            def keyPath = System.getenv('FINFLOW_STORE_FILE')
            if (keyPath) {
                storeFile file(keyPath)
                storePassword System.getenv('FINFLOW_STORE_PASSWORD')
                keyAlias System.getenv('FINFLOW_KEY_ALIAS')
                keyPassword System.getenv('FINFLOW_KEY_PASSWORD')
            }
        }`);
  const start = text.indexOf('buildTypes {');
  const tail = text.slice(start).replace(/(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.finflowRelease');
  if (tail === text.slice(start)) throw new Error('Release signing could not be configured');
  text = text.slice(0, start) + tail;
}
if (!text.includes('signingConfig signingConfigs.finflowRelease')) throw new Error('Release must use its own signing key');
if (!text.includes('// FinFlow Windows CMake paths')) {
  text += `
// FinFlow Windows CMake paths
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
    android {
        externalNativeBuild {
            cmake {
                buildStagingDirectory new File(rootDir.parentFile.parentFile, 'cxx')
            }
        }
        defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments.removeAll { it.startsWith('-DCMAKE_OBJECT_PATH_MAX=') }
                    arguments '-DCMAKE_OBJECT_PATH_MAX=240'
                }
            }
        }
    }
}
`;
}
fs.writeFileSync(target, text);
console.log('FinFlow release signing configured; credentials are read from the build environment.');
