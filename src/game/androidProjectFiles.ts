import settingsGradleRaw from '/settings.gradle.kts?raw';
import rootBuildGradleRaw from '/build.gradle.kts?raw';
import gradlePropertiesRaw from '/gradle.properties?raw';
import gradleWrapperPropsRaw from '/gradle/wrapper/gradle-wrapper.properties?raw';
import gradlewRaw from '/gradlew?raw';
import gradlewBatRaw from '/gradlew.bat?raw';
import appBuildGradleRaw from '/app/build.gradle.kts?raw';
import proguardRulesRaw from '/app/proguard-rules.pro?raw';
import manifestRaw from '/app/src/main/AndroidManifest.xml?raw';
import stringsXmlRaw from '/app/src/main/res/values/strings.xml?raw';
import themesXmlRaw from '/app/src/main/res/values/themes.xml?raw';
import icLauncherBgRaw from '/app/src/main/res/drawable/ic_launcher_background.xml?raw';
import icLauncherFgRaw from '/app/src/main/res/drawable/ic_launcher_foreground.xml?raw';
import icLauncherXmlRaw from '/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml?raw';
import icLauncherRoundXmlRaw from '/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml?raw';
import mainActivityKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/MainActivity.kt?raw';
import waterColorKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/model/WaterColor.kt?raw';
import bottleKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/model/Bottle.kt?raw';
import moveKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/model/Move.kt?raw';
import waterSortEngineKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/domain/WaterSortEngine.kt?raw';
import levelGeneratorKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/domain/LevelGenerator.kt?raw';
import colorKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/theme/Color.kt?raw';
import typeKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/theme/Type.kt?raw';
import themeKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/theme/Theme.kt?raw';
import glassBottleViewKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/components/GlassBottleView.kt?raw';
import introScreenKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/screens/IntroScreen.kt?raw';
import gameScreenKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/ui/screens/GameScreen.kt?raw';
import gameViewModelKtRaw from '/app/src/main/java/com/watersort/puzzlemaster/viewmodel/GameViewModel.kt?raw';
import unitTestKtRaw from '/app/src/test/java/com/watersort/puzzlemaster/WaterSortEngineTest.kt?raw';

export interface AndroidSourceFile {
  path: string;
  category: 'Kotlin UI (Compose)' | 'Domain & ViewModel' | 'Gradle & Build' | 'Android Resources' | 'Unit Tests';
  language: 'kotlin' | 'xml' | 'gradle' | 'properties' | 'shell';
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/MainActivity.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: mainActivityKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/screens/IntroScreen.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: introScreenKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/screens/GameScreen.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: gameScreenKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/components/GlassBottleView.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: glassBottleViewKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/theme/Color.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: colorKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/theme/Type.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: typeKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/ui/theme/Theme.kt',
    category: 'Kotlin UI (Compose)',
    language: 'kotlin',
    content: themeKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/viewmodel/GameViewModel.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: gameViewModelKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/domain/WaterSortEngine.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: waterSortEngineKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/domain/LevelGenerator.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: levelGeneratorKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/model/Bottle.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: bottleKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/model/WaterColor.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: waterColorKtRaw,
  },
  {
    path: 'app/src/main/java/com/watersort/puzzlemaster/model/Move.kt',
    category: 'Domain & ViewModel',
    language: 'kotlin',
    content: moveKtRaw,
  },
  {
    path: 'app/build.gradle.kts',
    category: 'Gradle & Build',
    language: 'gradle',
    content: appBuildGradleRaw,
  },
  {
    path: 'build.gradle.kts',
    category: 'Gradle & Build',
    language: 'gradle',
    content: rootBuildGradleRaw,
  },
  {
    path: 'settings.gradle.kts',
    category: 'Gradle & Build',
    language: 'gradle',
    content: settingsGradleRaw,
  },
  {
    path: 'gradle.properties',
    category: 'Gradle & Build',
    language: 'properties',
    content: gradlePropertiesRaw,
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    category: 'Gradle & Build',
    language: 'properties',
    content: gradleWrapperPropsRaw,
  },
  {
    path: 'gradlew.bat',
    category: 'Gradle & Build',
    language: 'shell',
    content: gradlewBatRaw,
  },
  {
    path: 'gradlew',
    category: 'Gradle & Build',
    language: 'shell',
    content: gradlewRaw,
  },
  {
    path: 'app/proguard-rules.pro',
    category: 'Gradle & Build',
    language: 'properties',
    content: proguardRulesRaw,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'Android Resources',
    language: 'xml',
    content: manifestRaw,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'Android Resources',
    language: 'xml',
    content: stringsXmlRaw,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    category: 'Android Resources',
    language: 'xml',
    content: themesXmlRaw,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    category: 'Android Resources',
    language: 'xml',
    content: icLauncherFgRaw,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    category: 'Android Resources',
    language: 'xml',
    content: icLauncherBgRaw,
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    category: 'Android Resources',
    language: 'xml',
    content: icLauncherXmlRaw,
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    category: 'Android Resources',
    language: 'xml',
    content: icLauncherRoundXmlRaw,
  },
  {
    path: 'app/src/test/java/com/watersort/puzzlemaster/WaterSortEngineTest.kt',
    category: 'Unit Tests',
    language: 'kotlin',
    content: unitTestKtRaw,
  },
];

// Standard CRC32 table for ZIP archive creation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a standard uncompressed ZIP archive containing the entire Android Studio project.
 */
export function createAndroidProjectZipBlob(): Blob {
  const encoder = new TextEncoder();
  const localFileParts: Uint8Array[] = [];
  const centralDirParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of ANDROID_PROJECT_FILES) {
    const nameBytes = encoder.encode(`WaterSortPuzzleMaster/${file.path}`);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true); // signature
    localView.setUint16(4, 20, true); // version needed
    localView.setUint16(6, 0, true); // flags
    localView.setUint16(8, 0, true); // compression (0 = store)
    localView.setUint16(10, 0, true); // mod time
    localView.setUint16(12, 0x5621, true); // mod date
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);
    localView.setUint32(22, size, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    // Central directory header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true); // signature
    centralView.setUint16(4, 20, true); // version made by
    centralView.setUint16(6, 20, true); // version needed
    centralView.setUint16(8, 0, true); // flags
    centralView.setUint16(10, 0, true); // compression
    centralView.setUint16(12, 0, true); // mod time
    centralView.setUint16(14, 0x5621, true); // mod date
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true);
    centralView.setUint32(24, size, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localFileParts.push(localHeader, contentBytes);
    centralDirParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  }

  let centralSize = 0;
  for (const part of centralDirParts) {
    centralSize += part.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, ANDROID_PROJECT_FILES.length, true);
  eocdView.setUint16(10, ANDROID_PROJECT_FILES.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);
  eocdView.setUint16(20, 0, true);

  return new Blob([...localFileParts, ...centralDirParts, eocd], {
    type: 'application/zip',
  });
}
