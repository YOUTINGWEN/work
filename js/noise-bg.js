(function () {
    var canvas = document.getElementById('noise-bg');
    if (!canvas || !canvas.getContext) { return; }
    var ctx = canvas.getContext('2d', { alpha: false });

    var BG = [217, 217, 217];   // #d9d9d9 背景色
    var DOT = [236, 236, 236];  // 靜止時基礎雜訊點，比背景更淺的灰色
    var TRAIL_DOT = [248, 248, 248]; // 尾巴雜訊點用更亮一點的灰色，加強流動感的能見度

    var BASE_DENSITY = 0.025;   // 靜止時的基礎雜訊密度（佔畫布像素比例）
    var BASE_INTERVAL = 90;     // 靜止時的重繪間隔（毫秒）／頻率較低
    var MIN_INTERVAL = 30;      // 有尾巴節點存在時的重繪間隔／頻率較高

    // 尾翼軌跡：滑鼠移動時沿路徑生成節點，每個節點會像液體一樣隨時間擴散、變淡、
    // 帶著慣性殘留速度繼續滑一小段，並垂直於行進方向左右擺動，形成拖曳的尾巴
    var NODE_SPACING = 14;      // 每隔多少 px 生成一個新節點（決定尾巴的密度／連續性）
    var NODE_LIFE = 1100;       // 節點壽命（毫秒），越長尾巴越長越明顯
    var NODE_SIGMA_START = 14;  // 節點剛生成時的擴散半徑
    var NODE_SIGMA_END = 52;    // 節點消散前的擴散半徑（像液體逐漸散開）
    var NODE_DOT_BASE = 130;    // 節點最新鮮時，每幀繪製的雜訊點數量上限
    var WAVE_FREQ = 0.012;      // 尾翼擺動的頻率
    var WAVE_AMP = 32;          // 尾翼擺動的最大振幅（px）
    var DRIFT_SPEED_PX = 3;     // 生成瞬間的殘留速度（px／每 16ms 幀），與生成時的方向一致，
                                 // 用固定值而非滑鼠事件的原始位移，避免滑鼠移動事件間距忽大
                                 // 忽小時，節點暴衝飛出原本的路徑
    var DRIFT_DECAY = 0.9;      // 殘留速度每幀衰減比例
    var MAX_NODES = 46;

    // 常態分布（Box-Muller），讓每個節點的雜訊點平滑地向外衰減，不會有明確的邊界
    function randNormal() {
        var u = Math.random() || 1e-6;
        var v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    var width = 0, height = 0;
    var template = null; // 預先填滿背景色的樣板，每幀重繪時用來快速重置畫布
    var imgData = null;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        imgData = ctx.createImageData(width, height);
        template = new Uint8ClampedArray(width * height * 4);
        for (var i = 0; i < template.length; i += 4) {
            template[i] = BG[0];
            template[i + 1] = BG[1];
            template[i + 2] = BG[2];
            template[i + 3] = 255;
        }
    }
    resize();
    window.addEventListener('resize', resize);

    var mouseX = -9999, mouseY = -9999;
    var lastMouseX = -9999, lastMouseY = -9999;
    var lastSpawnX = -9999, lastSpawnY = -9999;
    var nodes = []; // { x, y, vx, vy, angle, birth, phase }

    function spawnNode(x, y, angle, now) {
        nodes.push({
            x: x, y: y,
            vx: Math.cos(angle) * DRIFT_SPEED_PX,
            vy: Math.sin(angle) * DRIFT_SPEED_PX,
            angle: angle,
            birth: now,
            phase: Math.random() * Math.PI * 2
        });
        if (nodes.length > MAX_NODES) { nodes.shift(); }
    }

    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        var now = performance.now();

        if (lastMouseX > -9999) {
            var dx = mouseX - lastMouseX;
            var dy = mouseY - lastMouseY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.0001) {
                var angle = Math.atan2(dy, dx);
                var sdx = mouseX - lastSpawnX;
                var sdy = mouseY - lastSpawnY;
                var sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                // 依實際移動距離內插生成多個節點，滑鼠移動再快尾巴也不會斷點
                while (sdist >= NODE_SPACING) {
                    var t = NODE_SPACING / sdist;
                    lastSpawnX += sdx * t;
                    lastSpawnY += sdy * t;
                    spawnNode(lastSpawnX, lastSpawnY, angle, now);
                    sdx = mouseX - lastSpawnX;
                    sdy = mouseY - lastSpawnY;
                    sdist = Math.sqrt(sdx * sdx + sdy * sdy);
                }
            }
        } else {
            lastSpawnX = mouseX;
            lastSpawnY = mouseY;
        }
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
        mouseX = -9999;
        mouseY = -9999;
    });

    var lastDraw = 0;

    function draw(now) {
        requestAnimationFrame(draw);

        var interval = nodes.length > 0 ? MIN_INTERVAL : BASE_INTERVAL;
        if (now - lastDraw < interval) { return; }
        var dt = lastDraw ? (now - lastDraw) : 16;
        lastDraw = now;

        var data = imgData.data;
        data.set(template);

        var area = width * height;
        var i, x, y, idx;

        var baseCount = (area * BASE_DENSITY) | 0;
        for (i = 0; i < baseCount; i++) {
            x = (Math.random() * width) | 0;
            y = (Math.random() * height) | 0;
            idx = (y * width + x) * 4;
            data[idx] = DOT[0];
            data[idx + 1] = DOT[1];
            data[idx + 2] = DOT[2];
        }

        for (var n = nodes.length - 1; n >= 0; n--) {
            var node = nodes[n];
            var age = now - node.birth;
            if (age >= NODE_LIFE) { nodes.splice(n, 1); continue; }

            var t = age / NODE_LIFE; // 0（剛生成）→ 1（即將消失）
            var frames = dt / 16;

            // 殘留速度帶來的慣性滑行，隨時間衰減──像液體被撥動後繼續漂移、逐漸靜止
            node.x += node.vx * frames;
            node.y += node.vy * frames;
            node.vx *= Math.pow(DRIFT_DECAY, frames);
            node.vy *= Math.pow(DRIFT_DECAY, frames);

            // 垂直於當初移動方向的擺動，振幅隨年齡增加，像尾鰭甩動、液體逐漸散開飄動
            var wave = Math.sin(age * WAVE_FREQ + node.phase) * WAVE_AMP * t;
            var px = node.x - Math.sin(node.angle) * wave;
            var py = node.y + Math.cos(node.angle) * wave;

            var sigma = NODE_SIGMA_START + (NODE_SIGMA_END - NODE_SIGMA_START) * t;
            var intensity = Math.pow(1 - t, 0.6); // 前段維持較高強度，接近壽命尾聲才快速變淡
            var dotCount = (NODE_DOT_BASE * intensity) | 0;

            for (i = 0; i < dotCount; i++) {
                x = (px + randNormal() * sigma) | 0;
                y = (py + randNormal() * sigma) | 0;
                if (x < 0 || x >= width || y < 0 || y >= height) { continue; }
                idx = (y * width + x) * 4;
                data[idx] = TRAIL_DOT[0];
                data[idx + 1] = TRAIL_DOT[1];
                data[idx + 2] = TRAIL_DOT[2];
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    requestAnimationFrame(draw);
})();
