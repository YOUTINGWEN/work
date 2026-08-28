(function () {
	var cursor = document.getElementById('custom-cursor');
	if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
		return;
	}
	// .wrapper 有設定 perspective，會讓裡面的 position:fixed 元素改成相對
	// .wrapper 定位、跟著頁面內容一起被捲動，而不是真的固定在畫面上（頁面
	// 往下滑正方形會消失就是這個原因）。把游標搬到 <body> 底下當直接子元
	// 素，脫離 .wrapper，才會真正固定在畫面上、不隨捲動移動。
	document.body.appendChild(cursor);

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
