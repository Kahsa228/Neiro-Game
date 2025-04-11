WebSocket = require('ws'); 
const handleCommand = require('./handleCommand');

const server = http.createServer(); const wss = new WebSocket.Server({ server });

const rooms = {};

function createRoomIfNotExists(id) { if (!rooms[id]) { rooms[id] = { id, players: {}, bullets: [] }; } return rooms[id]; }

function broadcast(room, data) { for (const player of Object.values(room.players)) { if (player.ws.readyState === WebSocket.OPEN) { player.ws.send(JSON.stringify(data)); } } }

wss.on('connection', ws => { const id = Math.random().toString(36).slice(2); const room = createRoomIfNotExists('default');

const player = { id, ws, position: { x: Math.floor(Math.random() * 10), z: Math.floor(Math.random() * 10) }, health: 100, weapon: 'starter', model: 'default' };

room.players[id] = player;

ws.on('message', message => { let data; try { data = JSON.parse(message); } catch (e) { return; }

if (data.type === 'command') {
  handleCommand({ command: data.value, player, room, broadcast });
}

});

ws.on('close', () => { delete room.players[id]; broadcast(room, { type: 'player_disconnected', id }); }); });

server.listen(3000, () => { console.log('Server running on http://localhost:3000'); });
