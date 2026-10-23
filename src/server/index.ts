import { createGameServer } from './network';
const server = createGameServer();
server.http.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('Orbita WebSocket: port ' + (process.env.PORT || 3001)));
