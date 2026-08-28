(function () {
	var video = document.getElementById('hero-video');
	if (!video) { return; }

	function tryPlay() {
		var p = video.play();
		if (p && typeof p.catch === 'function') {
			p.catch(function () {});
		}
	}

	tryPlay();
	document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
	document.addEventListener('visibilitychange', function () {
		if (!document.hidden && video.paused) {
			tryPlay();
		}
	});
})();
