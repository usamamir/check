const path = require('path');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

/**
 * Disable ASAR integrity validation so Windows builds produced on Linux
 * (without working rcedit/wine) still launch.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exe = path.join(context.appOutDir, exeName);

  await flipFuses(exe, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: false,
  });

  console.log('afterPack: disabled ASAR integrity fuse for', exe);
};
