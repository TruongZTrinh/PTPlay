import { TikFinityProber } from './utils/TikFinityProber.js';

console.log('========================================================');
console.log('🔍 RUNNING TIKFINITY LIVE DIAGNOSTIC PROBE');
console.log('========================================================\n');

async function main() {
  const result = await TikFinityProber.runFullDiagnostic(0, 8088);
  console.log('Timestamp:', new Date(result.timestamp).toLocaleTimeString());
  console.log('TikFinity Port 21213:', result.tikfinityPort.message);
  console.log('TikFinity WebSocket:', result.tikfinityWs.message);
  if (result.tikfinityWs.details) {
    console.log('  Details:', result.tikfinityWs.details);
  }
  console.log('Game Client:', result.gameClient.message);

  if (result.recommendations.length > 0) {
    console.log('\n📋 Khuyến nghị:');
    result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  }
  console.log('\n========================================================');
}

void main();

