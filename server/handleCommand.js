module.exports = function handleCommand({ command, player, room, broadcast }) {
  try {
    if (!command.startsWith('/type game:')) return;

    const content = command.slice(11, command.indexOf('{')).trim();
    const [_, subject, actionPart] = content.split(':');

    if (subject.trim() !== 'local-player') return;

    const [action, ...params] = actionPart.trim().split(/\s+/);

    if (!room.players[player.id]) return;
    const playerData = room.players[player.id];

    switch (action) {
      case 'up':
        playerData.position.z -= 1;
        break;
      case 'down':
        playerData.position.z += 1;
        break;
      case 'left':
        playerData.position.x -= 1;
        break;
      case 'right':
        playerData.position.x += 1;
        break;
      case 'shoot': {
        const bulletId = Math.random().toString(36).slice(2);
        const bullet = {
          id: bulletId,
          ownerId: player.id,
          x: playerData.position.x,
          z: playerData.position.z - 1,
          dir: { x: 0, z: -1 },
          alive: true
        };
        room.bullets = room.bullets || [];
        room.bullets.push(bullet);
        broadcast(room, { type: 'spawn_bullet', bullet });

        setTimeout(() => {
          bullet.x += bullet.dir.x * 3;
          bullet.z += bullet.dir.z * 3;

          for (const p of Object.values(room.players)) {
            if (p.id !== player.id &&
                Math.abs(p.position.x - bullet.x) < 1 &&
                Math.abs(p.position.z - bullet.z) < 1) {
              p.health -= 25;
              broadcast(room, { type: 'update_health', id: p.id, value: p.health });
              broadcast(room, { type: 'bullet_hit', target: p.id, by: player.id });
            }
          }

          broadcast(room, { type: 'destroy_bullet', id: bulletId });
          bullet.alive = false;
        }, 500);
        break;
      }
      case '-switch': {
        const full = actionPart + ' ' + params.join(' ');
        const matchWeapon = full.match(/parameter=\s*weapon id="([^"]+)"/);
        const matchModel = full.match(/parameter=\s*model id="([^"]+)"/);

        if (matchWeapon) {
          playerData.weapon = matchWeapon[1];
          broadcast(room, { type: 'update_weapon', id: player.id, weapon: matchWeapon[1] });
        } else if (matchModel) {
          playerData.model = matchModel[1];
          broadcast(room, { type: 'update_model', id: player.id, model: matchModel[1] });
        }
        break;
      }
      case '-set': {
        const matchHealth = actionPart.match(/parameter=\s*health value=(\d+)/);
        if (matchHealth) {
          playerData.health = parseInt(matchHealth[1]);
          broadcast(room, { type: 'update_health', id: player.id, value: playerData.health });
        }
        break;
      }
    }

    broadcast(room, { type: 'update_position', id: player.id, position: playerData.position });
  } catch (err) {
    console.error('handleCommand error:', err);
  }
};
