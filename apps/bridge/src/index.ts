import { GameBridgeServer } from './server/GameBridgeServer.js';

const PORT = Number(process.env.PORT || 8088);
const server = new GameBridgeServer(PORT);

server.start().catch((err) => {
  console.error('[PTPlay Live Bridge] Fatal error on startup:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n[PTPlay Live Bridge] Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

