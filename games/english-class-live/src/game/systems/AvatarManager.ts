export class AvatarManager {
  private static readonly TRUSTED_CDN_SUFFIXES = [
    'tiktokcdn.com',
    'byteoversea.com',
    'ibytedtos.com',
    'musical.ly',
    'akamaized.net',
    'googleusercontent.com',
    'githubusercontent.com',
    'zerody.one',
  ];

  private imageCache: Map<string, HTMLImageElement> = new Map();
  private maxCache = 100;

  public isUrlSafe(urlStr?: string): boolean {
    if (!urlStr || typeof urlStr !== 'string' || urlStr.length > 1000) return false;
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
      const host = url.hostname.toLowerCase();
      // Block private / local ranges
      if (
        host === 'localhost' ||
        host.startsWith('127.') ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.endsWith('.local')
      ) {
        return false;
      }
      return AvatarManager.TRUSTED_CDN_SUFFIXES.some(
        (suffix) => host === suffix || host.endsWith('.' + suffix)
      );
    } catch {
      return false;
    }
  }

  public getFallbackBadgeCanvas(initial: string, colorHex = '#3b82f6', size = 64): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Draw outer golden ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = colorHex;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    // Draw letter initial
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((initial || 'H').toUpperCase().charAt(0), size / 2, size / 2 + 1);

    return canvas;
  }

  public loadAvatarImage(urlStr: string, onLoaded: (img: HTMLImageElement) => void, onError: () => void): void {
    if (!this.isUrlSafe(urlStr)) {
      onError();
      return;
    }

    if (this.imageCache.has(urlStr)) {
      onLoaded(this.imageCache.get(urlStr)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (this.imageCache.size >= this.maxCache) {
        const firstKey = this.imageCache.keys().next().value;
        if (firstKey) this.imageCache.delete(firstKey);
      }
      this.imageCache.set(urlStr, img);
      onLoaded(img);
    };

    img.onerror = () => {
      onError();
    };

    img.src = urlStr;
  }
}
