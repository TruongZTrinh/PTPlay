import Phaser from 'phaser';
import { CEREMONY_DURATION_MS, CEREMONY_REVEAL_TIMES } from '../constants';
import { RebusPlayerRecord } from '../types';
import { AvatarManager } from '../systems/AvatarManager';
import type { AudioEngine } from '../audio/AudioEngine';

const TIERS = [
  { x: 0, avatarY: -98, radius: 40, top: 12, width: 134, color: 0xffd46b, border: 0xc68c2f, ink: '#79501d', title: 'QUÁN QUÂN' },
  { x: -143, avatarY: -20, radius: 28, top: 70, width: 126, color: 0xdce8e8, border: 0x93adb0, ink: '#42636c', title: 'Á QUÂN' },
  { x: 143, avatarY: 0, radius: 27, top: 89, width: 126, color: 0xf1c9a2, border: 0xbe8b5d, ink: '#83532f', title: 'QUÝ QUÂN' },
] as const;

export class CeremonyPodium {
  private overlay?: Phaser.GameObjects.Container;
  private timers: Phaser.Time.TimerEvent[] = [];
  private tweens: Phaser.Tweens.Tween[] = [];

  constructor(private scene: Phaser.Scene, private avatars?: AvatarManager, private audio?: AudioEngine) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.hide, this);
  }

  public show(players: RebusPlayerRecord[]): void {
    this.hide();
    const winners = players.filter(player => player.score > 0).slice(0, 3);
    const overlay = this.scene.add.container(270, 480).setDepth(195);
    this.overlay = overlay;
    overlay.setSize(540, 960).setInteractive();

    const shade = this.scene.add.graphics();
    shade.fillStyle(0x052d26, 0.78);
    shade.fillRect(-270, -480, 540, 960);
    overlay.add(shade);
    const card = this.scene.add.container(0, 0).setScale(0.92).setAlpha(0);
    overlay.add(card);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1b2114, 0.35);
    bg.fillRoundedRect(-234, -262, 476, 544, 25);
    bg.fillStyle(0x925328, 1);
    bg.fillRoundedRect(-237, -270, 474, 540, 23);
    bg.fillStyle(0xffdf8d, 1);
    bg.fillRoundedRect(-233, -266, 466, 532, 20);
    bg.fillStyle(0xfffae5, 1);
    bg.fillRoundedRect(-227, -260, 454, 520, 16);
    card.add(bg);

    const rays = this.scene.add.graphics({ x: 0, y: -88 });
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      rays.fillStyle(0xe9b640, 0.12);
      rays.fillTriangle(0, 0, Math.cos(angle) * 150, Math.sin(angle) * 150,
        Math.cos(angle + 0.15) * 150, Math.sin(angle + 0.15) * 150);
    }
    card.add(rays);
    this.animate({ targets: rays, angle: 360, duration: 32000, repeat: -1 });
    const confetti = this.scene.add.container();
    card.add(confetti);
    this.text(card, 0, -241, 'LỄ TRAO GIẢI', 11, '#98632e');
    this.text(card, 0, -215, winners.length ? 'NGÔI SAO LỚP HỌC' : 'SẴN SÀNG TỎA SÁNG', 25, '#07533e');
    const subtitle = this.text(card, 0, -184, winners.length
      ? 'Ai sẽ trở thành quán quân của lớp?'
      : 'Bình luận đáp án ở vòng tới để lên bục vinh danh!', 11, '#64826a', false);

    const suspense = this.scene.add.container().setVisible(winners.length > 0);
    card.add(suspense);
    const mystery = this.scene.add.circle(0, -98, 38, 0xffedbb).setStrokeStyle(2, 0xe3b459);
    suspense.add(mystery);
    this.text(suspense, 0, -98, '?', 44, '#b7842b');
    this.text(suspense, 0, -39, 'QUÁN QUÂN SẮP LỘ DIỆN', 10, '#98632e');
    this.animate({ targets: mystery, scale: 1.1, alpha: 0.55, duration: 420, yoyo: true, repeat: 3 });

    const stage = this.scene.add.graphics();
    stage.fillStyle(0x253d2b, 0.12);
    stage.fillEllipse(0, 172, 430, 25);
    stage.fillStyle(0x07533e, 1);
    stage.fillRoundedRect(-215, 151, 430, 18, 7);
    stage.fillStyle(0x377b55, 1);
    stage.fillRoundedRect(-215, 151, 430, 5, 3);
    card.add(stage);

    TIERS.forEach((tier, index) => {
      const player = winners[index];
      const group = this.scene.add.container(tier.x, 20).setAlpha(0);
      card.add(group);
      const block = this.scene.add.graphics();
      block.fillStyle(tier.border, 1);
      block.fillRoundedRect(-tier.width / 2, tier.top, tier.width, 153 - tier.top, { tl: 10, tr: 10, bl: 0, br: 0 });
      block.fillStyle(tier.color, 1);
      block.fillRoundedRect(-tier.width / 2 + 3, tier.top + 2, tier.width - 6, 149 - tier.top, { tl: 8, tr: 8, bl: 0, br: 0 });
      block.fillStyle(0xffffff, 0.42);
      block.fillRoundedRect(-tier.width / 2 + 6, tier.top + 5, tier.width - 12, 5, 2);
      group.add(block);
      this.text(group, 0, tier.top + 22, tier.title, index === 0 ? 12 : 10, tier.ink);
      this.text(group, 0, index === 0 ? 88 : tier.top + 48, String(index + 1), index === 0 ? 52 : 31, tier.ink);
      this.avatar(group, player, tier.avatarY, tier.radius, index);
      const nameY = index === 0 ? -39 : tier.avatarY + 44;
      const name = this.text(group, 0, nameY, player?.nickname || 'Chờ bạn tỏa sáng', index === 0 ? 18 : 12, '#164e39');
      this.fitText(name, index === 0 ? 148 : 126);
      const score = this.text(group, 0, nameY + (index === 0 ? 27 : 21),
        player ? `${player.score.toLocaleString('vi-VN')} điểm` : '—', index === 0 ? 21 : 14, tier.ink);
      this.fitText(score, index === 0 ? 148 : 126);
      this.animate({ targets: group, alpha: 1, y: 0, duration: 550, delay: CEREMONY_REVEAL_TIMES[index], ease: 'Back.easeOut',
        onStart: () => {
          if (index === 0) suspense.destroy();
          if (!player) return;
          this.audio?.playPodiumReveal(index + 1);
          if (index === 0) {
            subtitle.setText('Cùng vỗ tay cho những thám tử xuất sắc nhất!');
            this.audio?.playApplause();
            sprinkle(40);
            this.animate({ targets: card, scale: 1.015, duration: 140, yoyo: true, ease: 'Sine.easeOut' });
          }
        },
      });
    });

    this.text(card, 0, 194, 'MỘT TRÀNG PHÁO TAY CHO CẢ LỚP!', 12, '#07533e');
    const countdown = this.text(card, 0, 224, '', 11, '#98632e', false);
    const track = this.scene.add.graphics();
    track.fillStyle(0xeadcbb, 1);
    track.fillRoundedRect(-175, 245, 350, 4, 2);
    card.add(track);
    const progress = this.scene.add.rectangle(-175, 247, 350, 4, 0x2b865d).setOrigin(0, 0.5);
    card.add(progress);
    const deadline = Date.now() + CEREMONY_DURATION_MS;
    const updateCountdown = () => countdown.setText(`Vòng mới bắt đầu sau ${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))} giây`);
    updateCountdown();
    this.timers.push(this.scene.time.addEvent({ delay: 200, loop: true, callback: updateCountdown }));
    this.animate({ targets: progress, scaleX: 0, duration: CEREMONY_DURATION_MS, ease: 'Linear' });
    this.animate({ targets: card, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });

    const sprinkle = (count: number) => {
      const colors = [0xffc84e, 0xef7887, 0x5dbf9b, 0x79bddd, 0xb897da];
      for (let i = 0; i < count; i++) {
        const particle = this.scene.add.rectangle(Phaser.Math.Between(-211, 211), -252,
          Phaser.Math.Between(3, 5), Phaser.Math.Between(5, 9), colors[i % colors.length]);
        confetti.add(particle);
        this.animate({ targets: particle, y: 177, x: particle.x + Phaser.Math.Between(-12, 12),
          angle: Phaser.Math.Between(-260, 260), alpha: 0, duration: Phaser.Math.Between(2400, 3700),
          delay: i * 22, onComplete: () => particle.destroy() });
      }
    };
    sprinkle(24);
    this.timers.push(this.scene.time.addEvent({ delay: 1100, repeat: 9, callback: () => sprinkle(10) }));
    if (winners.length > 0) {
      const launch = (x: number, color: number) => {
        this.audio?.playFirework(x / 270);
        const y = -143;
        const rocket = this.scene.add.circle(x, y + 85, 2, color);
        confetti.add(rocket);
        this.animate({ targets: rocket, y, duration: 320, ease: 'Quad.easeOut', onComplete: () => rocket.destroy() });
        this.timers.push(this.scene.time.delayedCall(320, () => {
          for (let i = 0; i < 22; i++) {
            const angle = i * Math.PI * 2 / 22;
            const radius = Phaser.Math.Between(34, 48);
            const spark = this.scene.add.rectangle(x, y, 3, 8, color).setRotation(angle);
            confetti.add(spark);
            this.animate({ targets: spark, x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius + 8,
              alpha: 0, scale: 0.3, duration: 850, ease: 'Quad.easeOut', onComplete: () => spark.destroy() });
          }
        }));
      };
      for (const [delay, x, color] of [[3020, -175, 0xffc84e], [3370, 175, 0xe58aaa],
        [6200, -175, 0x4bb89b], [8800, 175, 0xe58aaa], [10900, -175, 0xffc84e],
        [11220, 175, 0xe58aaa], [11540, -160, 0x4bb89b], [11920, 160, 0xffc84e]]) {
        this.timers.push(this.scene.time.delayedCall(delay, () => launch(x, color)));
      }
      this.timers.push(this.scene.time.delayedCall(10400, () => this.audio?.playApplause()));
    }
    this.timers.push(this.scene.time.delayedCall(CEREMONY_DURATION_MS - 450, () => {
      this.animate({ targets: overlay, alpha: 0, duration: 400, onComplete: () => this.hide() });
    }));
  }

  private text(parent: Phaser.GameObjects.Container, x: number, y: number, value: string,
    size: number, color: string, bold = true): Phaser.GameObjects.Text {
    const label = this.scene.add.text(x, y, value, {
      fontFamily: 'system-ui, sans-serif', fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
    }).setOrigin(0.5);
    parent.add(label);
    return label;
  }

  private fitText(label: Phaser.GameObjects.Text, width: number): void {
    const chars = Array.from(label.text);
    while (label.width > width && chars.length > 1) {
      chars.pop();
      label.setText(`${chars.join('')}…`);
    }
  }

  private avatar(parent: Phaser.GameObjects.Container, player: RebusPlayerRecord | undefined,
    y: number, radius: number, tier: number): void {
    const group = this.scene.add.container(0, y);
    parent.add(group);
    const palette = TIERS[tier];
    if (tier === 0) {
      const halo = this.scene.add.circle(0, 0, radius + 7, 0xffcf5b, 0.25);
      group.add(halo);
      this.animate({ targets: halo, scale: 1.18, alpha: 0.08, duration: 850, yoyo: true, repeat: -1 });
    }
    group.add(this.scene.add.circle(0, 0, radius, palette.color));
    const initial = this.text(group, 0, 0, player ? Array.from(player.nickname.trim())[0]?.toUpperCase() || '?' : '★',
      Math.round(radius * 0.9), palette.ink);
    const border = this.scene.add.circle(0, 0, radius).setStrokeStyle(tier === 0 ? 3 : 2, palette.border);
    group.add(border);
    if (tier === 0) {
      const crown = this.scene.add.graphics({ x: 0, y: -radius - 15 });
      crown.fillStyle(0xe7a92d, 1);
      crown.fillPoints([{ x: -15, y: 7 }, { x: -18, y: -7 }, { x: -7, y: -1 },
        { x: 0, y: -13 }, { x: 7, y: -1 }, { x: 18, y: -7 }, { x: 15, y: 7 }], true);
      crown.fillStyle(0xffe299, 1);
      crown.fillRoundedRect(-14, 8, 28, 4, 2);
      group.add(crown);
      this.animate({ targets: crown, y: crown.y - 4, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (player?.avatarUrl && this.avatars) {
      this.avatars.loadAvatar(player.userId, player.avatarUrl, () => {
        if (!group.scene) return;
        const circleKey = this.avatars?.getCircleTextureKey(player.userId);
        const key = circleKey && this.scene.textures.exists(circleKey) ? circleKey : this.avatars?.getTextureKey(player.userId);
        if (key && this.scene.textures.exists(key)) {
          group.add(this.scene.add.image(0, 0, key).setDisplaySize(radius * 2 - 3, radius * 2 - 3));
          initial.setVisible(false);
          group.bringToTop(border);
        }
      });
    }
  }

  private animate(config: Phaser.Types.Tweens.TweenBuilderConfig): void {
    this.tweens.push(this.scene.tweens.add(config));
  }

  public hide(): void {
    this.audio?.stopCeremonySounds();
    this.timers.forEach(timer => timer.remove(false));
    this.timers = [];
    this.tweens.forEach(tween => tween.stop());
    this.tweens = [];
    this.overlay?.destroy(true);
    this.overlay = undefined;
  }

  public destroy(): void {
    this.hide();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.hide, this);
  }
}
