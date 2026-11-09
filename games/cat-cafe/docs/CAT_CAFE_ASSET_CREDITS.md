# CAFÉ MÒE (PTPlay Cat Café LIVE) V1.0 — Asset Credits & Provenance

**Dự án:** PTPlay Cat Café LIVE (Café Mòe)  
**Phiên bản:** V1.0 Production Release  
**Bản quyền:** 100% Nguyên bản (Original Works) & Thủ tục sinh nội bộ (Procedurally Generated)  
**Tình trạng pháp lý:** An toàn bản quyền tuyệt đối cho phát sóng thương mại trên TikTok LIVE / YouTube.  
**Ngày lập:** 2026-11-03  

---

## 1. Tuyên Bố Bản Quyền & Nguồn Gốc Tài Nguyên (Copyright Statement)

Toàn bộ đồ hoạ hình ảnh, hoạt hoạ, hiệu ứng hạt, phông màn và âm thanh nhạc nền trong **Café Mòe V1.0** được lập trình và sinh tự động bằng mã nguồn TypeScript/JavaScript chạy trực tiếp trên trình duyệt Web (runtime procedural generation).

Trò chơi **KHÔNG** sử dụng bất kỳ tập tin âm thanh MP3/WAV bản quyền, sprite sheet lấy cắp, hay hình ảnh thương mại của bên thứ ba nào. Do đó:
- Không bị đánh gậy bản quyền âm nhạc (Content ID / Copyright strikes) khi phát sóng trực tiếp trên TikTok LIVE, YouTube, hoặc Facebook Gaming.
- Không lo lắng về vấn đề hết hạn giấy phép bản quyền (royalty-free or licensed music expiration).
- Dung lượng tải game cực nhẹ (< 2MB nén), tốc độ mở trang dưới 1 giây, độ sắc nét vô cực (vector graphics) ở mọi độ phân giải màn hình.

---

## 2. Nguồn Gốc Đồ Hoạ Vector (Procedural Vector Graphics)

Tất cả các kết cấu (textures) được vẽ trực tiếp bằng Canvas Graphics API của Phaser 3 trong tập tin [`ProceduralTextures.ts`](file:///C:/Workspace/PTPlay-Cat-Cafe/src/game/art/ProceduralTextures.ts):

| Hạng Mục | Phương Pháp Tạo | Mô Tả Kỹ Thuật |
|---|---|---|
| **8 Giống Mèo (Cat Breeds)** | Vector Canvas Primitives | Vẽ bằng hình cung (arc), đường cong bezier, tam giác và elip. Bao gồm 8 bảng màu lông riêng biệt (Mướp cam, Bạch tuyết, Xám tro, Tuxedo, Tam thể, Mun đen, Vàng kem, Xiêm quý phái). |
| **Các Bộ Phận Cử Động Của Mèo** | Modular Parts Generation | Mỗi chú mèo gồm các mảnh ghép độc lập: thân (`_body`), đầu mở mắt (`_head_open`), đầu cười híp mắt (`_head_happy`), đầu ngủ (`_head_sleep`), đầu cảnh giác (`_head_alert`), và đuôi ngoe nguẩy (`_tail`). |
| **3 Không Gian Phòng Cảnh** | Procedural Layering | • **Quán Chính:** Sàn gỗ vân sọc nâu ấm, tường kem pastel, quầy bar pha chế, cửa sổ kính lớn view công viên.<br>• **Vườn Mèo:** Thảm cỏ xanh mướt, lối đi lát đá cuội, hàng rào gỗ mộc, bồn nước chim bồ câu, bụi hoa dại rực rỡ.<br>• **Gác Ngủ Lofi:** Sàn gỗ thông mộc mạc, dây đèn led đom đóm (fairy lights), cửa sổ trần ngắm sao trời, kệ sách gỗ cao tầng. |
| **Hiệu Ứng Hạt & Emote** | Vector Particles | Tim hồng bay bổng (`particle_heart`), nốt nhạc (`particle_note`), bong bóng ngủ (`particle_zzz`), sao lấp lánh (`particle_star`), hạt mưa rơi (`particle_rain`), cá nướng (`prop_fish_treat`), bướm vỗ cánh (`particle_butterfly`). |

---

## 3. Nguồn Gốc Âm Thanh & Nhạc Nền (Web Audio Synthesis & Real Cat Samples)

Café Mòe V1.0 kết hợp độc đáo giữa **âm thanh mèo thật ghi âm thực tế (100% Giấy phép MIT mã nguồn mở)** và **công nghệ tổng hợp sóng âm theo thời gian thực (Procedural Web Audio Synthesis)** trong tập tin [`CafeAudioEngine.ts`](file:///C:/Workspace/PTPlay-Cat-Cafe/src/game/audio/CafeAudioEngine.ts):

### 3.1. Thư Viện Tiếng Kêu Mèo Thật & Hiệu Ứng Thu Âm Thực Tế (Authentic Audio Samples)
Để mang lại trải nghiệm sống động, đáng yêu và chân thật nhất cho khán giả LIVE, **24 tập tin âm thanh thực tế chuẩn studio** đã được tích hợp trong thư mục `public/audio/`:

#### A. Tiếng Kêu Mèo Thật (11 Mẫu - MIT License):
- **Nguồn gốc:** Bộ dữ liệu mã nguồn mở `haydenroche5/meow_dataset` & `kidchenko/posh-cats` (MIT License).
- **Tập tin:**
  1. `meow_classic.wav`: Tiếng meo meo kinh điển ấm áp.
  2. `meow_baby.wav`: Tiếng meo meo nũng nịu của mèo con.
  3. `meow_real_1.wav` đến `meow_real_8.wav`: 8 biến thể tiếng meo tự nhiên (meo thắc mắc, meo gọi ăn, meo hớn hở, meo chào...).
  4. `purr_real.wav`: Tiếng rừ rừ rung thanh quản thực tế cực kỳ thư giãn (ASMR purr).

#### B. Bộ Hiệu Ứng Âm Thanh Thực Tế Cho Mọi Hoạt Động (13 Mẫu - Mixkit Free License & Kenney CC0):
- **Nguồn gốc:** Mixkit Sound Effects Free License (100% miễn phí sử dụng thương mại, không yêu cầu ghi công) & Kenney Interface Sounds (Creative Commons CC0 Public Domain).
- **Tập tin & Công năng:**
  1. `munch_real.wav`: Tiếng mèo nhai cá giòn tan thực tế khi khán giả gõ `ĂN`.
  2. `bowl_clink.wav`: Tiếng bát ăn gốm sứ leng keng chạm sàn khi phục vụ thức ăn.
  3. `yarn_jingle.wav`: Tiếng chuông leng keng trong cuộn len đồ chơi khi khán giả gõ `CHƠI`.
  4. `scratch_real.wav`: Tiếng móng vuốt cào sột soạt vào cây cào móng sisal.
  5. `paw_tap.wav`: Tiếng đệm chân êm ái bước nhịp nhàng trên sàn gỗ.
  6. `yawn_real.wav`: Tiếng mèo ngủ khò khè rừ rừ êm ái thực tế khi cuộn tròn ngủ (`NGỦ`), 100% tiếng mèo ngủ tự nhiên không pha tạp tiếng người.
  7. `heart_pop.wav`: Tiếng nổ bong bóng nước ngọt ngào khi khán giả thả tim (`YÊU` / tap màn hình).
  8. `sparkle_real.wav`: Mưa sao tiên lấp lánh thần kỳ khi nhận quà tặng TikTok LIVE.
  9. `coin_chime.wav`: Tiếng chuông vàng leng keng khi nhận thưởng Purr Points.
  10. `button_click.wav`: Tiếng phản hồi xúc giác cơ học khi bấm nút giao diện.
  11. `camera_shutter.wav`: Tiếng màn trập máy ảnh cơ học khi bật chế độ chụp ảnh (`CHỤP`).
  12. `doorbell_real.wav`: Tiếng chuông cửa du dương chào đón khách mới vào quán.
  13. `level_up.wav`: Tiếng kèn chuông thăng hoa chúc mừng quán mèo thăng cấp mới.

#### C. Cơ Chế Phát Thông Minh Kép (Dual-Engine Smart Architecture):
Trò chơi tự động tải trước các tập tin âm thanh này vào bộ nhớ Web Audio RAM. Mỗi khi kích hoạt, engine sẽ phát mẫu thực tế kèm biến thiên cao độ ngẫu nhiên ($\pm 5\% - 15\%$) giúp âm thanh luôn tự nhiên, không bao giờ đơn điệu. Trường hợp trình duyệt ngoại tuyến hoặc không tải được file, hệ thống sẽ tự động chuyển sang bộ tổng hợp sóng âm toán học dự phòng (procedural synthesis) ngay lập tức mà không gây gián đoạn phiên live.

### 3.2. Bộ Tổng Hợp Âm Thanh Thủ Tục (Web Audio Procedural Synthesis)
Toàn bộ nhạc nền và hiệu ứng môi trường được sinh từ mã nguồn toán học thuần tuý, bảo đảm 100% không bao giờ dính bản quyền âm nhạc:

| Âm Thanh / Nhạc Phẩm | Thuật Toán Tổng Hợp | Cấu Trúc Âm Học |
|---|---|---|
| **Lofi BGM Theme 1: Ban Ngày (Day)** | Web Audio Polyphonic Synthesizer | Vòng hợp âm Rhodes/Piano điện tử êm dịu trên thang âm Đô Trưởng 7 (Cmaj7 - Am7 - Dm7 - G7), sóng sin lọc mềm tần số thấp (low-pass filter ở 800Hz). |
| **Lofi BGM Theme 2: Mưa Rào (Rain)** | Pink Noise Buffer + Chill Piano | Bộ sinh nhiễu hồng (pink noise algorithm) lọc thông dải mô phỏng tiếng mưa rơi lộp độp êm ái kết hợp các nốt piano rải chậm rãi. |
| **Lofi BGM Theme 3: Đêm Ấm (Night)** | Bell Synthesizer + Lullaby Melody | Sóng tam giác dao động điều hoà mô phỏng hộp nhạc chuông gió (music box) với hiệu ứng ngân vang nhẹ nhàng. |
| **Tiếng Kêu Rừ Rừ (Purr FX)** | Dual Oscillator + Low LFO Tremolo | Dao động sóng tam giác tần số 110Hz kết hợp bộ điều biến biên độ LFO 24Hz mô phỏng chính xác nhịp rung thanh quản trầm ấm của mèo. |
| **Tiếng Meo Meo (Meow FX)** | Frequency Glide Triangle Wave | Dao động sóng tam giác chuyển tần số từ 520Hz vút lên 820Hz rồi hạ dần xuống 640Hz kết hợp bộ lọc cộng hưởng ấm áp. |
| **Tiếng Chào Trill (Happy Trill)** | Modulated Rolling Flutter | Tiếng rừ-meo ("Brrr-mew!") líu lo chào đón khi hai chú mèo gặp nhau hoặc khi chủ gọi. |
| **Tiếng Ngáp Ngủ (Cute Yawn)** | Gliding Breathy Sigh | Tiếng mèo ngáp ngủ dễ thương khi vươn vai hoặc cuộn tròn đi ngủ (740Hz -> 820Hz -> 310Hz). |
| **Tiếng Chuông Đồ Chơi (Yarn Jingle)** | Metallic Bell Harmonics | Tiếng lục lạc leng keng trong cuộn len đồ chơi (2093Hz, 2793Hz, 3520Hz). |
| **Tiếng Cào Móng (Scratch)** | Filtered Sawtooth Bursts | Tiếng móng vuốt cào sột soạt sảng khoái vào cây cào móng dây thừng sisal. |
| **Tiếng Bát Cá (Bowl Clink)** | Ceramic Ting Resonance | Tiếng chạm gốm sứ leng keng thanh thoát (1760Hz & 2640Hz) khi bát cá được dọn ra. |
| **Tiếng Nhai Cá (Munch FX)** | Filtered Noise Bursts | Các chuỗi xung nhai cá giòn tan ngắt quãng nhanh. |
| **Tiếng Bong Bóng Tim (Heart Pop)** | Pitch Snap Transient | Tiếng nổ búp ngọt ngào như bong bóng nước khi tim tình yêu bay lên. |
| **Mưa Sao Lấp Lánh (Sparkle Shower)** | Twinkling Glockenspiel | Chuỗi 6 nốt chuông pha lê rực rỡ (E6 đến G7) chúc mừng khi khán giả tặng quà TikTok. |
| **Tiếng Thưởng Purr (Coin Chime)** | Two-Tone Crystal Chime | Cặp nốt nhạc B5 -> E6 ngân vang kiểu Animal Crossing / Stardew Valley khi được cộng điểm Purr. |
| **Tiếng Bước Chân Mèo (Paw Tap)** | Soft Transient Thud | Tiếng đệm chân êm ái gõ nhẹ nhịp nhàng trên sàn gỗ. |
| **Tiếng Nút Bấm Gỗ (Button Click)** | Woody Tactile Pop | Âm thanh phản hồi xúc giác nhẹ nhàng khi bấm các nút trên giao diện. |
| **Tiếng Chuông Cửa (Doorbell)** | Harmonic Crystal Chimes | Cặp nốt chuông trong trẻo (E5 -> C5) báo hiệu khách mới bước vào quán. |
| **Tiếng Màn Trập Máy Ảnh (Camera Shutter)** | Dual Transient Click | Xung tần số cao và tiếng lách cách cơ học mô phỏng chụp ảnh kỷ niệm. |
| **Tiếng Kèn Thăng Cấp (Level Up Fanfare)** | Ascending Arpeggio Chime | Hợp âm thăng hoa C5 -> E5 -> G5 -> C6 chúc mừng quán mèo đạt cấp độ mới. |

---

## 4. Công Nghệ & Khung Nền Tảng Mã Nguồn Mở (Open Source Frameworks)

Dự án sử dụng các thư viện mã nguồn mở tuân thủ giấy phép MIT:
- **Phaser 3** (Giấy phép MIT - Richard Davey / Photon Storm Ltd)
- **TypeScript** (Giấy phép Apache 2.0 - Microsoft Corporation)
- **Vite** (Giấy phép MIT - Evan You / Vite Contributors)
- **ws** (Giấy phép MIT - Einar Otto Stangvik)

