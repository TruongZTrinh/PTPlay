import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'C:\\Users\\ad\\.gemini\\antigravity\\brain\\a3f95814-b25c-4ef2-931e-63bd826945e8';

const captures = [
  { name: 'english_class_540x960.png', url: 'http://localhost:5175/', w: 540, h: 960 },
  { name: 'english_class_1080x1920.png', url: 'http://localhost:5175/', w: 1080, h: 1920 },
  { name: 'english_class_reveal_540x960.png', url: 'http://localhost:5175/?reveal=1', w: 540, h: 960 },
  { name: 'english_class_reveal_1080x1920.png', url: 'http://localhost:5175/?reveal=1', w: 1080, h: 1920 },
  { name: 'teacher_pose_idle_540x960.png', url: 'http://localhost:5175/?pose=idle', w: 540, h: 960 },
  { name: 'teacher_pose_point_540x960.png', url: 'http://localhost:5175/?pose=point', w: 540, h: 960 },
  { name: 'teacher_pose_talk_540x960.png', url: 'http://localhost:5175/?pose=talk', w: 540, h: 960 },
  { name: 'teacher_pose_happy_540x960.png', url: 'http://localhost:5175/?pose=happy', w: 540, h: 960 },
  { name: 'teacher_pose_sad_540x960.png', url: 'http://localhost:5175/?pose=sad', w: 540, h: 960 },
  { name: 'teacher_pose_cheer_540x960.png', url: 'http://localhost:5175/?pose=cheer', w: 540, h: 960 },
];

for (const cap of captures) {
  const outPath = path.join(targetDir, cap.name);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  console.log(`Capturing ${cap.w}x${cap.h} (${cap.name})...`);
  const cmd = `"${chrome}" --headless=new --disable-gpu --hide-scrollbars --window-size=${cap.w},${cap.h} --virtual-time-budget=2000 "--screenshot=${outPath}" "${cap.url}"`;
  execSync(cmd, { stdio: 'ignore' });
  if (fs.existsSync(outPath)) {
    console.log(`✓ Saved: ${cap.name} (${fs.statSync(outPath).size} bytes)`);
  } else {
    console.error(`✗ Failed to create: ${cap.name}`);
  }
}
