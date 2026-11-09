import net from 'node:net';
import { WebSocket } from 'ws';

export interface DiagnosticProbeResult {
  timestamp: number;
  tikfinityPort: {
    open: boolean;
    port: number;
    message: string;
  };
  tikfinityWs: {
    connected: boolean;
    latencyMs?: number;
    message: string;
    details?: string;
  };
  bridgeHttp: {
    status: 'ok';
    port: number;
  };
  gameClient: {
    connected: boolean;
    clientsCount: number;
    message: string;
  };
  recommendations: string[];
}

export class TikFinityProber {
  public static async checkPort(port = 21213, host = '127.0.0.1', timeoutMs = 1200): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  public static async probeTikFinityWs(endpoint = 'ws://127.0.0.1:21213/', timeoutMs = 2500): Promise<{
    connected: boolean;
    latencyMs?: number;
    message: string;
    details?: string;
  }> {
    const startTime = Date.now();
    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { ws.close(); } catch {}
          resolve({
            connected: false,
            message: 'Timeout: Không thể hoàn tất WebSocket handshake trong 2.5 giây',
          });
        }
      }, timeoutMs);

      let ws: WebSocket;
      try {
        ws = new WebSocket(endpoint);

        ws.on('open', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            const latency = Date.now() - startTime;
            ws.close();
            resolve({
              connected: true,
              latencyMs: latency,
              message: `Xác minh thành công: TikFinity Desktop đang chạy và phản hồi tốt (Độ trễ: ${latency}ms)`,
              details: `WebSocket Handshake với cổng 21213 thành công`,
            });
          }
        });

        ws.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve({
              connected: false,
              message: `Không thể kết nối tới TikFinity Desktop: ${err.message}`,
              details: 'Cổng 21213 không có ứng dụng TikFinity phản hồi hoặc bị tường lửa chặn',
            });
          }
        });
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({
            connected: false,
            message: `Lỗi khởi tạo kết nối: ${(e as Error).message}`,
          });
        }
      }
    });
  }

  public static async runFullDiagnostic(gameClientsCount: number, bridgePort = 8088): Promise<DiagnosticProbeResult> {
    const portOpen = await this.checkPort(21213);
    const recommendations: string[] = [];

    let wsResult: { connected: boolean; latencyMs?: number; message: string; details?: string };
    if (portOpen) {
      wsResult = await this.probeTikFinityWs();
      if (!wsResult.connected) {
        recommendations.push('Cổng 21213 mở nhưng WebSocket handshake thất bại. Hãy khởi động lại TikFinity Desktop.');
      }
    } else {
      wsResult = {
        connected: false,
        message: 'Cổng 21213 đang đóng. Ứng dụng TikFinity Desktop chưa được bật trên máy tính này.',
        details: 'ECONNREFUSED 127.0.0.1:21213',
      };
      recommendations.push('Mở phần mềm TikFinity Desktop trên máy tính và bật Event API trong Settings.');
    }

    const gameConnected = gameClientsCount > 0;
    if (!gameConnected) {
      recommendations.push('Mở game Mini War Arena tại http://localhost:5173 và nhấn Bắt Đầu để kết nối Game Client.');
    }

    return {
      timestamp: Date.now(),
      tikfinityPort: {
        open: portOpen,
        port: 21213,
        message: portOpen
          ? 'Cổng 21213 mở (Ứng dụng cục bộ đang lắng nghe)'
          : 'Cổng 21213 đóng (TikFinity Desktop chưa chạy)',
      },
      tikfinityWs: wsResult,
      bridgeHttp: {
        status: 'ok',
        port: bridgePort,
      },
      gameClient: {
        connected: gameConnected,
        clientsCount: gameClientsCount,
        message: gameConnected
          ? `Game Client đã kết nối (${gameClientsCount} client active)`
          : 'Chưa có Game Client nào kết nối. Hãy mở http://localhost:5173 trong trình duyệt.',
      },
      recommendations,
    };
  }
}

