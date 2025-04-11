const WebSocket = require('ws');
const { handleCommand } = require('./handleCommand');

const wss = new WebSocket.Server({ port: 8080 });
const rooms = {};
let nextId = 1;

wss.on('connection', (ws) => {
  const player = {
    id: nextId++,
    ws,
    position: { x: Math.random() * 10 - 5, z: Math.random() * 10 - 5 },
    health: 100,
    model: 'default',
    weapon: 'starter',
    privilege: true
  };

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }

    if (data.type === 'init') {
      player.nickname = data.nickname;
      let room = rooms[data.roomName];
      if (!room) {
        room = { name: data.roomName, players: {} };
        rooms[data.roomName] = room;
      }
      room.players[player.id] = player;

      ws.send(JSON.stringify({ type: 'connected', id: player.id, spawnPoint: player.position }));
      broadcast(room, { type: 'player_joined', id: player.id, nickname: player.nickname, position: player.position });
    }
    else if (data.type === 'command') {
      handleCommand(data.command, player, rooms);
    }
  });

  ws.on('close', () => {
    for (const room of Object.values(rooms)) {
      if (room.players[player.id]) {
        delete room.players[player.id];
        broadcast(room, { type: 'player_left', id: player.id });
      }
    }
  });
});

function broadcast(room, message) {
  for (const p of Object.values(room.players)) {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify(message));
    }
  }
}

console.log("Server started on ws://localhost:8080");
