function handleCommand(command, player, rooms) {
  const room = Object.values(rooms).find(r => r.players[player.id]);
  if (!room) return;

  const match = command.match(/^\/type game:?\\s*(\\w+)-player:\\s*(\\w+)(.*)/);
  if (!match) return;

  const [, target, action, rest] = match;
  const targetPlayer = (target === 'local') ? player : Object.values(room.players).find(p => p.nickname === target);
  if (!targetPlayer) return;

  if (['up', 'down', 'left', 'right'].includes(action)) {
    if (action === 'up') targetPlayer.position.z -= 1;
    if (action === 'down') targetPlayer.position.z += 1;
    if (action === 'left') targetPlayer.position.x -= 1;
    if (action === 'right') targetPlayer.position.x += 1;

    broadcast(room, {
      type: 'update_position',
      id: targetPlayer.id,
      position: targetPlayer.position
    });
  }

  if (action === '-switch' && rest.includes('weapon')) {
    const match = rest.match(/id\\s*=\\s*"(.+?)"/);
    if (match) {
      targetPlayer.weapon = match[1];
    }
  }

  if (action === '-switch' && rest.includes('model')) {
    const match = rest.match(/id\\s*=\\s*"(.+?)"/);
    if (match) {
      targetPlayer.model = match[1];
      broadcast(room, {
        type: 'update_model',
        id: targetPlayer.id,
        model: targetPlayer.model
      });
    }
  }

  if (action === '-set' && rest.includes('health')) {
    const match = rest.match(/value\\s*=\\s*(\\d+)/);
    if (match) {
      targetPlayer.health = parseInt(match[1]);
      broadcast(room, {
        type: 'update_health',
        id: targetPlayer.id,
        value: targetPlayer.health
      });
    }
  }
}

function broadcast(room, message) {
  for (const p of Object.values(room.players)) {
    if (p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(message));
    }
  }
}

module.exports = { handleCommand };
