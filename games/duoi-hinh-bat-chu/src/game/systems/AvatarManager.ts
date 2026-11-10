import Phaser from 'phaser';

export class AvatarManager {
  private scene: Phaser.Scene;
  private loadedAvatars = new Set<string>();
  private pendingUrls = new Map<string, string>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public isSafeUrl(url?: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname.includes('tiktok') ||
        hostname.includes('tiktokcdn') ||
        hostname.includes('byteoversea') ||
        hostname.includes('ibytedtos') ||
        hostname.includes('googleusercontent') ||
        hostname.includes('example.com') ||
        hostname.includes('unsplash') ||
        hostname.includes('dicebear') ||
        hostname.includes('pravatar') ||
        hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        url.startsWith('/') ||
        url.startsWith('./')
      );
    } catch {
      return false;
    }
  }

  public getTextureKey(userId: string): string {
    return `avatar_${userId}`;
  }

  public getCircleTextureKey(userId: string): string {
    return `avatar_circle_${userId}`;
  }

  public loadAvatar(userId: string, url?: string, onComplete?: () => void): void {
    if (!this.isSafeUrl(url)) {
      if (onComplete) onComplete();
      return;
    }

    const textureKey = this.getTextureKey(userId);
    if (this.scene.textures.exists(textureKey)) {
      this.createCircleTexture(userId, textureKey);
      if (onComplete) onComplete();
      return;
    }

    if (this.pendingUrls.has(textureKey)) return;
    this.pendingUrls.set(textureKey, url!);

    this.scene.load.image(textureKey, url!);
    this.scene.load.once(`filecomplete-image-${textureKey}`, () => {
      this.loadedAvatars.add(textureKey);
      this.pendingUrls.delete(textureKey);
      this.createCircleTexture(userId, textureKey);
      if (onComplete) onComplete();
    });
    this.scene.load.once(`loaderror`, (fileObj: any) => {
      if (fileObj?.key === textureKey) {
        this.pendingUrls.delete(textureKey);
        if (onComplete) onComplete();
      }
    });

    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  public createCircleTexture(userId: string, sourceKey: string, size: number = 128): void {
    const circleKey = this.getCircleTextureKey(userId);
    if (this.scene.textures.exists(circleKey)) return;
    try {
      const sourceTex = this.scene.textures.get(sourceKey);
      if (!sourceTex) return;
      const img = sourceTex.getSourceImage() as HTMLImageElement;
      if (!img) return;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        this.scene.textures.addCanvas(circleKey, canvas);
      }
    } catch {
      // Ignore cross-origin canvas security exceptions and fall back to base texture
    }
  }

  public hasAvatar(userId: string): boolean {
    const key = this.getTextureKey(userId);
    return this.scene.textures.exists(key);
  }
}

