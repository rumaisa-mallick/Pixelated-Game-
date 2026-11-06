/* Player and collectible entities. */
(function () {
    'use strict';
    const CQ = (window.CQ = window.CQ || {});
    const T = 16;

    const P = {
        out: '#1a121f',
        skin: '#f2c79a',
        skinDark: '#d49a6c',
        hair: '#5b3c22',
        hairLight: '#7e5830',
        tunic: '#d9455a',
        tunicDark: '#a32c3f',
        tunicLight: '#ef6272',
        belt: '#33241f',
        gold: '#e3b64d',
        pants: '#3c4560',
        boot: '#241f2d',
        eye: '#1a1120'
    };

    function rect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }

    function ellipse(ctx, cx, cy, rx, ry, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    class Player {
        constructor(map) {
            this.x = map.spawn.x;
            this.y = map.spawn.y;
            this.dir = 'down';
            this.moving = false;
            this.sprinting = false;
            this.walk = 0;
            this.footTimer = 0;
            this.speed = 94;
        }

        collides(cx, cy, map) {
            const hw = 5;
            const hh = 5;
            const points = [
                [cx - hw, cy - hh],
                [cx + hw, cy - hh],
                [cx - hw, cy + hh],
                [cx + hw, cy + hh],
                [cx, cy - hh],
                [cx, cy + hh],
                [cx - hw, cy],
                [cx + hw, cy]
            ];
            for (const p of points) {
                if (CQ.Maps.isSolid(map, p[0], p[1])) return true;
            }
            return false;
        }

        update(dt, input, map, onFootstep) {
            let dx = 0;
            let dy = 0;
            if (input.up) dy -= 1;
            if (input.down) dy += 1;
            if (input.left) dx -= 1;
            if (input.right) dx += 1;

            this.moving = dx !== 0 || dy !== 0;

            if (this.moving) {
                if (dx !== 0 && dy !== 0) {
                    dx *= 0.70710678;
                    dy *= 0.70710678;
                }
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.dir = dx > 0 ? 'right' : 'left';
                } else {
                    this.dir = dy > 0 ? 'down' : 'up';
                }
            }

            this.sprinting = input.sprint && this.moving;

            let speed = this.speed * (this.sprinting ? 1.48 : 1);
            if (CQ.Maps.isSlow(map, this.x, this.y)) speed *= 0.68;

            const nx = this.x + dx * speed * dt;
            if (!this.collides(nx, this.y, map)) this.x = nx;

            const ny = this.y + dy * speed * dt;
            if (!this.collides(this.x, ny, map)) this.y = ny;

            if (this.moving) {
                this.walk += dt * (this.sprinting ? 12 : 8.4);
                this.footTimer += dt;
                if (this.footTimer > (this.sprinting ? 0.13 : 0.19)) {
                    this.footTimer = 0;
                    if (onFootstep) onFootstep(this);
                }
            } else {
                this.walk = 0;
            }
        }

        draw(ctx, camX, camY) {
            const x = Math.round(this.x - camX);
            const y = Math.round(this.y - camY);

            ellipse(ctx, x, y + 1, 7, 3, 'rgba(0, 0, 0, 0.34)');

            const bob = this.moving && Math.floor(this.walk * 2) % 2 === 0 ? -1 : 0;
            const top = y - 18 + bob;
            const step = this.moving ? Math.round(Math.sin(this.walk * Math.PI) * 2) : 0;
            const armSwing = this.moving ? Math.round(Math.sin(this.walk * Math.PI) * -1) : 0;

            // legs
            rect(ctx, x - 5, top + 14 - step, 4, 3, P.pants);
            rect(ctx, x - 5, top + 16 - step, 4, 2, P.boot);
            rect(ctx, x + 1, top + 14 + step, 4, 3, P.pants);
            rect(ctx, x + 1, top + 16 + step, 4, 2, P.boot);

            // body
            rect(ctx, x - 6, top + 6, 12, 9, P.out);
            rect(ctx, x - 5, top + 7, 10, 7, P.tunic);
            rect(ctx, x - 5, top + 7, 2, 6, P.tunicDark);
            rect(ctx, x - 3, top + 8, 1, 3, P.tunicLight);

            // belt
            rect(ctx, x - 5, top + 11, 10, 2, P.belt);
            rect(ctx, x - 1, top + 11, 2, 2, P.gold);

            // arms
            rect(ctx, x - 7, top + 8 + armSwing, 2, 5, P.tunicDark);
            rect(ctx, x - 7, top + 11 + armSwing, 2, 2, P.skin);
            rect(ctx, x + 5, top + 8 - armSwing, 2, 5, P.tunicDark);
            rect(ctx, x + 5, top + 11 - armSwing, 2, 2, P.skin);

            // neck + collar
            rect(ctx, x - 2, top + 5, 4, 2, P.skinDark);
            rect(ctx, x - 2, top + 6, 4, 1, P.gold);

            // head
            rect(ctx, x - 5, top, 10, 7, P.out);
            rect(ctx, x - 4, top + 1, 8, 5, P.skin);
            rect(ctx, x - 5, top + 3, 1, 2, P.skinDark);
            rect(ctx, x + 4, top + 3, 1, 2, P.skinDark);

            // hair
            if (this.dir === 'up') {
                rect(ctx, x - 5, top, 10, 6, P.hair);
                rect(ctx, x - 4, top + 1, 2, 1, P.hairLight);
                rect(ctx, x + 2, top + 4, 2, 2, P.hair);
            } else if (this.dir === 'left') {
                rect(ctx, x - 5, top, 10, 3, P.hair);
                rect(ctx, x + 1, top + 2, 4, 4, P.hair);
                rect(ctx, x - 4, top + 2, 1, 2, P.hair);
                rect(ctx, x - 3, top + 1, 2, 1, P.hairLight);
            } else if (this.dir === 'right') {
                rect(ctx, x - 5, top, 10, 3, P.hair);
                rect(ctx, x - 5, top + 2, 4, 4, P.hair);
                rect(ctx, x + 3, top + 2, 1, 2, P.hair);
                rect(ctx, x + 1, top + 1, 2, 1, P.hairLight);
            } else {
                rect(ctx, x - 5, top, 10, 3, P.hair);
                rect(ctx, x - 4, top + 2, 2, 2, P.hair);
                rect(ctx, x + 2, top + 2, 2, 2, P.hair);
                rect(ctx, x - 3, top + 1, 2, 1, P.hairLight);
            }

            // eyes + mouth
            if (this.dir === 'down') {
                rect(ctx, x - 3, top + 3, 1, 2, P.eye);
                rect(ctx, x + 2, top + 3, 1, 2, P.eye);
                rect(ctx, x - 1, top + 5, 2, 1, P.skinDark);
            } else if (this.dir === 'left') {
                rect(ctx, x - 4, top + 3, 1, 2, P.eye);
                rect(ctx, x - 4, top + 4, 2, 1, P.skin);
            } else if (this.dir === 'right') {
                rect(ctx, x + 2, top + 3, 1, 2, P.eye);
            }

            // tiny shine on the tunic
            rect(ctx, x + 2, top + 8, 1, 1, P.tunicLight);
        }
    }

    class Coin {
        constructor(data) {
            this.x = data.x;
            this.y = data.y;
            this.kind = data.kind;
            this.phase = data.phase || 0;
            this.value = this.kind === 'gem' ? 5 : 1;
            this.collected = false;
        }

        update(dt, player) {
            if (this.collected) return Infinity;

            const tx = player.x;
            const ty = player.y - 6;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

            if (dist < 36) {
                const pull = (1 - dist / 36) * 260 + 90;
                this.x += (dx / dist) * pull * dt;
                this.y += (dy / dist) * pull * dt;
            }

            const nx = tx - this.x;
            const ny = ty - this.y;
            return Math.sqrt(nx * nx + ny * ny);
        }

        draw(ctx, camX, camY, time) {
            if (this.collected) return;

            const x = this.x - camX;
            const y = this.y - camY;
            const bob = Math.sin(time * 2.4 + this.phase) * 2;
            const cy = y + bob;
            const isGem = this.kind === 'gem';

            ellipse(ctx, x, y + 6, 5, 2, 'rgba(0, 0, 0, 0.25)');

            const glow = ctx.createRadialGradient(x, cy, 0, x, cy, 14);
            glow.addColorStop(0, isGem ? 'rgba(90, 235, 235, 0.36)' : 'rgba(255, 205, 90, 0.38)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - 14, cy - 14, 28, 28);

            const spin = Math.cos(time * 3 + this.phase);
            const sx = Math.max(0.18, Math.abs(spin));

            ctx.save();
            ctx.translate(Math.round(x), Math.round(cy));
            ctx.scale(sx, 1);

            if (isGem) {
                const rows = [2, 4, 6, 8, 10, 8, 6, 4, 2];
                for (let i = 0; i < rows.length; i++) {
                    const w = rows[i];
                    ctx.fillStyle = '#0c4a55';
                    ctx.fillRect(-(w >> 1), -4 + i, w, 1);
                    if (w > 2) {
                        ctx.fillStyle = i < 3 ? '#8ffcf6' : '#4fd8d6';
                        ctx.fillRect(-(w >> 1) + 1, -4 + i, w - 2, 1);
                    }
                }
                ctx.fillStyle = '#d8fffc';
                ctx.fillRect(-1, -2, 2, 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(1, 1, 1, 1);
            } else {
                const rows = [6, 8, 10, 10, 10, 10, 10, 8, 6];
                for (let i = 0; i < rows.length; i++) {
                    const w = rows[i];
                    ctx.fillStyle = '#5f3a08';
                    ctx.fillRect(-(w >> 1), -4 + i, w, 1);
                    if (w > 2) {
                        ctx.fillStyle = i === 0 || i === rows.length - 1 ? '#b97d1c' : '#f0b03a';
                        ctx.fillRect(-(w >> 1) + 1, -4 + i, w - 2, 1);
                    }
                }
                ctx.fillStyle = '#ffe28a';
                ctx.fillRect(-2, -2, 2, 2);
                ctx.fillStyle = '#fff3c4';
                ctx.fillRect(1, 1, 1, 1);
            }

            ctx.restore();
        }
    }

    CQ.Player = Player;
    CQ.Coin = Coin;
})();
