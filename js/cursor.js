(function () {
	var cursor = document.getElementById('custom-cursor');
	if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		return;
	}
	document.addEventListener('mousemove', function (e) {
		cursor.style.left = e.clientX + 'px';
		cursor.style.top = e.clientY + 'px';
	});
	document.addEventListener('mouseover', function (e) {
		if (e.target.closest('a')) {
			cursor.classList.add('cursor-hover');
		}
	});
	document.addEventListener('mouseout', function (e) {
		if (e.target.closest('a')) {
			cursor.classList.remove('cursor-hover');
		}
	});
})();
