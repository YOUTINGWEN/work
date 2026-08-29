(function () {
    var canvas = document.getElementById('noise-bg');
    if (!canvas || !canvas.getContext) { return; }
    var ctx = canvas.getContext('2d', { alpha: false });

    var BG = [217, 217, 217];   // #d9d9d9 背景色
    var DOT = [236, 236, 236];  // 比背景更淺的灰色雜訊點

    var BASE_DENSITY = 0.025;   // 靜止時的基礎雜訊密度（佔畫布像素比例）
    var EXTRA_DENSITY = 0.05;   // 滑鼠擾動時，額外增加的雜訊密度
    var BASE_INTERVAL = 90;     // 靜止時的重繪間隔（毫秒）／頻率較低
    var MIN_INTERVAL = 30;      // 擾動最大時的重繪間隔／頻率較高（約 60fps）
    var RADIUS = 100;           // 滑鼠周圍受影響的半徑（px）

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

    // 滑鼠影響雜訊頻率：移動越快，畫面更新頻率越高，游標周圍雜訊也越密集
    var mouseX = -9999, mouseY = -9999;
    var lastMouseX = -9999, lastMouseY = -9999;
    var disturbance = 0; // 0~1，隨時間自然衰減

    window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (lastMouseX > -9999) {
            var dx = mouseX - lastMouseX;
            var dy = mouseY - lastMouseY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            disturbance = Math.min(1, disturbance + dist * 0.01);
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

        disturbance *= 0.95; // 每幀衰減，讓擾動效果自然消退
        if (disturbance < 0.002) { disturbance = 0; }

        var interval = BASE_INTERVAL - (BASE_INTERVAL - MIN_INTERVAL) * disturbance;
        if (now - lastDraw < interval) { return; }
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

        if (disturbance > 0 && mouseX > -9999) {
            var extraCount = (area * EXTRA_DENSITY * disturbance) | 0;
            for (i = 0; i < extraCount; i++) {
                var angle = Math.random() * Math.PI * 2;
                var r = Math.random() * RADIUS;
                x = (mouseX + Math.cos(angle) * r) | 0;
                y = (mouseY + Math.sin(angle) * r) | 0;
                if (x < 0 || x >= width || y < 0 || y >= height) { continue; }
                idx = (y * width + x) * 4;
                data[idx] = DOT[0];
                data[idx + 1] = DOT[1];
                data[idx + 2] = DOT[2];
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    requestAnimationFrame(draw);
})();
