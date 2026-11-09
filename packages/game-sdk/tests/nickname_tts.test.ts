import test from 'node:test';
import assert from 'node:assert';
import { VietnameseVoiceHelper } from '../src/tts.js';

test('1. formatNicknameForSpeech: Converts ALL CAPS to Title Case (prevents acronym letter-spelling)', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('MINH QUÂN'), 'Minh Quân');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('NGỌC ANH'), 'Ngọc Anh');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('HUY'), 'Huy');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('LAN ANH'), 'Lan Anh');
});

test('2. formatNicknameForSpeech: Splits camelCase and PascalCase into natural words', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('LanAnh'), 'Lan Anh');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('NgocMinh'), 'Ngoc Minh');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('BaoBao'), 'Bao Bao');
});

test('3. formatNicknameForSpeech: Replaces delimiters (_, -, ., /) with spaces (no spoken underscore)', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('anh_tuan_99'), 'Anh Tuan 99');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('lan.anh'), 'Lan Anh');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('thanh-hang-2k'), 'Thanh Hang 2000');
});

test('4. formatNicknameForSpeech: Strips emojis and decorative Unicode symbols', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('🌸 Bé Mèo 🐾'), 'Bé Mèo');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('🔥 Huy Pro 🔥'), 'Huy Pro');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('✨Thảo Nhi✨'), 'Thảo Nhi');
});

test('5. formatNicknameForSpeech: Collapses repeated letters (Huuuuyyy -> Huy)', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Huuuuyyy'), 'Huy');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Meeeeoooo'), 'Meo');
});

test('6. formatNicknameForSpeech: Replaces generic bot/id usernames with friendly fallback', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('user123456789'), 'bạn khán giả');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('tiktok_882910'), 'bạn khán giả');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('123456789'), 'bạn khán giả');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('user88'), 'khán giả 88');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('', 'bạn học sinh'), 'bạn học sinh');
});

test('7. formatNicknameForSpeech: Phonetically adapts foreign letters (J, W, Z) and English names', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Jack'), 'Giắc');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Jenny'), 'Gen-ny');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('David'), 'Đê-vít');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Alex'), 'A-lếch');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Peter'), 'Pi-tơ');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Wendy'), 'Oen-đi');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Zin'), 'Din');
});

test('8. formatNicknameForSpeech: Converts 2kX slang to 200X and handles birth years', () => {
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('LanAnh2k4'), 'Lan Anh 2004');
  assert.strictEqual(VietnameseVoiceHelper.formatNicknameForSpeech('Tuan2005'), 'Tuan 2005');
});
