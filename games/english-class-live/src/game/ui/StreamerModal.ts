import { ClassroomTheme, QuizMode, StreamerConfig } from '../types.js';
import { QuizEngine } from '../systems/QuizEngine.js';
import { TTSController } from '../systems/TTSController.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { ClassroomPresentation } from '../visuals/ClassroomPresentation.js';
import { GiftReactionController } from '../systems/GiftReactionController.js';

export class StreamerModal {
  private overlayEl: HTMLDivElement | null = null;
  public isVisible = false;

  constructor(
    private engine: QuizEngine,
    private tts: TTSController,
    private audio: AudioEngine,
    private presentation: ClassroomPresentation,
    private giftFx: GiftReactionController,
    private config: StreamerConfig,
    private onConfigChange: (newCfg: StreamerConfig) => void
  ) {
    this.createDomElements();
    this.setupKeyBindings();
  }

  private setupKeyBindings(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  private createDomElements(): void {
    // 1. Floating gear button in top right (outside stream safe zone)
    const gearBtn = document.createElement('button');
    gearBtn.innerHTML = '⚙️';
    gearBtn.title = 'Bảng Điều Khiển Streamer (Phím D hoặc Tab)';
    Object.assign(gearBtn.style, {
      position: 'absolute',
      top: '12px',
      right: '12px',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'rgba(30, 41, 59, 0.85)',
      color: '#ffffff',
      border: '1px solid #475569',
      cursor: 'pointer',
      zIndex: '2000',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    gearBtn.onclick = () => this.toggle();
    document.body.appendChild(gearBtn);

    // 2. Full modal overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '3000',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#f8fafc',
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width: '90%',
      maxWidth: '480px',
      maxHeight: '85vh',
      overflowY: 'auto',
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
    });

    modal.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:10px; margin-bottom:14px;">
        <h3 style="margin:0; font-size:16px; color:#facc15;">⚙️ BẢNG ĐIỀU KHIỂN STREAMER</h3>
        <button id="close-modal-btn" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
      </div>

      <!-- Mode & Theme -->
      <div style="margin-bottom:14px;">
        <label style="font-size:12px; font-weight:bold; color:#cbd5e1; display:block; margin-bottom:4px;">Chế Độ Chơi (Game Mode):</label>
        <select id="select-mode" style="width:100%; padding:6px 10px; background:#0f172a; color:#ffffff; border:1px solid #475569; borderRadius:6px;">
          <option value="quick">1. Quick Quiz (Trắc nghiệm nhanh)</option>
          <option value="picture">2. Picture Quiz (Nhìn hình đoán nghĩa)</option>
          <option value="listening">3. Listening Challenge (Nghe phát âm)</option>
          <option value="spelling">4. Spelling Bee (Chính tả chuẩn)</option>
          <option value="team">5. Team Battle (Đấu Đội Đỏ vs Xanh)</option>
          <option value="survival">6. Survival Class (Sinh Tồn 3 Tim)</option>
          <option value="boss">7. Boss Question (Câu Hỏi Trùm Hợp Tác)</option>
          <option value="challenge">8. Challenge Hour (Chủ đề mở rộng)</option>
        </select>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:14px;">
        <div style="flex:1;">
          <label style="font-size:12px; font-weight:bold; color:#cbd5e1; display:block; margin-bottom:4px;">Giao diện (Theme):</label>
          <select id="select-theme" style="width:100%; padding:6px 8px; background:#0f172a; color:#ffffff; border:1px solid #475569; borderRadius:6px;">
            <option value="day">Ban ngày (Day)</option>
            <option value="evening">Buổi tối (Evening)</option>
            <option value="party">Tiệc lớp (Party)</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size:12px; font-weight:bold; color:#cbd5e1; display:block; margin-bottom:4px;">Thời gian câu hỏi:</label>
          <select id="select-duration" style="width:100%; padding:6px 8px; background:#0f172a; color:#ffffff; border:1px solid #475569; borderRadius:6px;">
            <option value="10">10 giây (Nhanh)</option>
            <option value="12" selected>12 giây (Chuẩn)</option>
            <option value="15">15 giây</option>
            <option value="20">20 giây (Dễ)</option>
          </select>
        </div>
      </div>

      <!-- TTS Controls -->
      <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:14px; border:1px solid #334155;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:12px; font-weight:bold; color:#38bdf8;">🔊 PTPlay TTS (Bi-lingual)</span>
          <label style="font-size:11px; cursor:pointer;">
            <input type="checkbox" id="check-tts" checked /> Bật TTS
          </label>
        </div>
        <div style="display:flex; gap:12px; margin-bottom:6px; font-size:11px;">
          <label><input type="checkbox" id="check-vi" checked /> Tiếng Việt (Dẫn dắt)</label>
          <label><input type="checkbox" id="check-en" checked /> Tiếng Anh (Câu hỏi)</label>
        </div>
        <button id="btn-test-tts" style="width:100%; padding:5px; background:#2563eb; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">
          🎙️ Phát Thử Giọng Cô Giáo (Test TTS)
        </button>
      </div>

      <!-- Privacy & Display -->
      <div style="display:flex; gap:12px; margin-bottom:14px; font-size:11px;">
        <label><input type="checkbox" id="check-hide-ava" /> Ẩn Avatar (Bảo vệ riêng tư)</label>
        <label><input type="checkbox" id="check-motion" /> Giảm hiệu ứng (Reduce Motion)</label>
      </div>

      <!-- Mock Simulation Panel -->
      <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #334155;">
        <div style="font-size:12px; font-weight:bold; color:#a855f7; margin-bottom:8px;">🧪 Giả Lập Tương Tác Khán Giả (Mock Test)</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <button id="mock-join-btn" style="padding:6px; background:#334155; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer;">+ 1 Học Sinh (JOIN)</button>
          <button id="mock-ans-btn" style="padding:6px; background:#334155; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer;">Trả lời Đáp án A/B</button>
          <button id="mock-gift-btn" style="padding:6px; background:#334155; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer;">Tặng Hoa Hồng / Tim</button>
          <button id="mock-universe-btn" style="padding:6px; background:#334155; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer;">Tặng Quà Vũ Trụ 🌌</button>
        </div>
        <button id="mock-stress-btn" style="width:100%; margin-top:6px; padding:6px; background:#7c3aed; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">
          🚀 Bật 30 Học Sinh Tham Gia Cùng Lúc (Stress Test)
        </button>
      </div>

      <div style="text-align:right;">
        <button id="btn-save" style="padding:7px 18px; background:#22c55e; color:white; border:none; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;">Lưu & Đóng</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    // Attach event listeners
    const closeBtn = modal.querySelector('#close-modal-btn') as HTMLButtonElement;
    closeBtn.onclick = () => this.hide();

    const saveBtn = modal.querySelector('#btn-save') as HTMLButtonElement;
    saveBtn.onclick = () => {
      this.applyFormChanges();
      this.hide();
    };

    const modeSelect = modal.querySelector('#select-mode') as HTMLSelectElement;
    modeSelect.value = this.config.mode;
    modeSelect.onchange = () => {
      const newMode = modeSelect.value as QuizMode;
      this.config.mode = newMode;
      this.engine.startRound(newMode);
    };

    const themeSelect = modal.querySelector('#select-theme') as HTMLSelectElement;
    themeSelect.value = this.config.theme;
    themeSelect.onchange = () => {
      const newTheme = themeSelect.value as ClassroomTheme;
      this.config.theme = newTheme;
      this.presentation.setTheme(newTheme);
    };

    const testTtsBtn = modal.querySelector('#btn-test-tts') as HTMLButtonElement;
    testTtsBtn.onclick = () => {
      this.tts.unlock();
      this.audio.unlock();
      this.tts.speak('Xin chào cả lớp! Mình cùng luyện tiếng Anh nhé! Let us practice English together!', 'vi-VN', 3);
    };

    // Mock buttons
    const mockJoinBtn = modal.querySelector('#mock-join-btn') as HTMLButtonElement;
    mockJoinBtn.onclick = () => {
      const names = ['An Nhiên', 'Minh Khang', 'Gia Huy', 'Thùy Chi', 'Bảo Ngọc', 'Hoàng Nam', 'Khánh Linh'];
      const pick = names[Math.floor(Math.random() * names.length)];
      const id = `mock_user_${Date.now()}_${Math.floor(Math.random() * 100)}`;
      this.engine.join({ id, nickname: pick });
    };

    const mockAnsBtn = modal.querySelector('#mock-ans-btn') as HTMLButtonElement;
    mockAnsBtn.onclick = () => {
      const players = this.engine.roster.getAllPlayers();
      if (players.length === 0) {
        this.engine.join({ id: 'mock_1', nickname: 'Mai Anh' });
      }
      const choices: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const target = this.engine.roster.getAllPlayers()[0];
      if (target && this.engine.currentQuestion) {
        const pick = Math.random() < 0.7 ? this.engine.currentQuestion.correct : choices[Math.floor(Math.random() * 4)];
        this.engine.submitAnswer(target.id, pick);
      }
    };

    const mockGiftBtn = modal.querySelector('#mock-gift-btn') as HTMLButtonElement;
    mockGiftBtn.onclick = () => {
      this.giftFx.enqueueGift('Khán Giả', 'Rose', 1);
    };

    const mockUniBtn = modal.querySelector('#mock-universe-btn') as HTMLButtonElement;
    mockUniBtn.onclick = () => {
      this.giftFx.enqueueGift('Đại Gia Live', 'Universe', 1);
    };

    const mockStressBtn = modal.querySelector('#mock-stress-btn') as HTMLButtonElement;
    mockStressBtn.onclick = () => {
      const names = [
        'An', 'Bình', 'Chi', 'Dũng', 'Em', 'Giang', 'Hải', 'Hằng', 'Khoa', 'Linh',
        'Mai', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tú', 'Uyên', 'Vân', 'Xuân',
        'Yến', 'Ánh', 'Bách', 'Cúc', 'Đức', 'Hương', 'Kiên', 'Long', 'Nhung', 'Trang'
      ];
      names.forEach((name, idx) => {
        setTimeout(() => {
          this.engine.join({ id: `stress_user_${idx + 1}`, nickname: name });
        }, idx * 60);
      });
    };
  }

  private applyFormChanges(): void {
    if (!this.overlayEl) return;
    const hideAva = (this.overlayEl.querySelector('#check-hide-ava') as HTMLInputElement).checked;
    const ttsOn = (this.overlayEl.querySelector('#check-tts') as HTMLInputElement).checked;
    const viOn = (this.overlayEl.querySelector('#check-vi') as HTMLInputElement).checked;
    const enOn = (this.overlayEl.querySelector('#check-en') as HTMLInputElement).checked;
    const reducedMotion = (this.overlayEl.querySelector('#check-motion') as HTMLInputElement).checked;

    this.config.hideAvatars = hideAva;
    this.config.ttsEnabled = ttsOn;
    this.config.ttsVietnamese = viOn;
    this.config.ttsEnglish = enOn;
    this.config.reducedMotion = reducedMotion;

    this.tts.enabled = ttsOn;
    this.tts.vietnameseEnabled = viOn;
    this.tts.englishEnabled = enOn;

    this.onConfigChange(this.config);
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      this.isVisible = true;
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.isVisible = false;
    }
  }

  public toggle(): void {
    if (this.isVisible) this.hide();
    else this.show();
  }
}
