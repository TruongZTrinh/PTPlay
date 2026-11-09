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
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname.includes('tiktok') ||
        hostname.includes('tiktokcdn') ||
        hostname.includes('byteoversea') ||
        hostname.includes('ibytedtos') ||
        hostname.includes('googleusercontent') ||
        hostname.includes('example.com')
      );
    } catch {
      return false;
    }
  }

  public getTextureKey(userId: string): string {
    return `avatar_${userId}`;
  }

  public loadAvatar(userId: string, url?: string, onComplete?: () => void): void {
    if (!this.isSafeUrl(url)) {
      if (onComplete) onComplete();
      return;
    }

    const textureKey = this.getTextureKey(userId);
    if (this.scene.textures.exists(textureKey)) {
      if (onComplete) onComplete();
      return;
    }

    if (this.pendingUrls.has(textureKey)) return;
    this.pendingUrls.set(textureKey, url!);

    this.scene.load.image(textureKey, url!);
    this.scene.load.once(`filecomplete-image-${textureKey}`, () => {
      this.loadedAvatars.add(textureKey);
      this.pendingUrls.delete(textureKey);
      if (onComplete) onComplete();
    });
    this.scene.load.once(`loaderror`, (fileObj: any) => {
      if (fileObj?.key === textureKey) {
        this.pendingUrls.delete(textureKey);
      }
    });

    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  public hasAvatar(userId: string): boolean {
    const key = this.getTextureKey(userId);
    return this.scene.textures.exists(key);
  }
}

