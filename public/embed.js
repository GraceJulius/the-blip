(function () {
  var s = document.currentScript;
  if (!s) return;
  var token = s.getAttribute('data-token');
  if (!token) { console.error('TheBlip embed: add data-token="..." to the script tag.'); return; }
  var base = new URL(s.src).origin;
  var f = document.createElement('iframe');
  f.src = base + '/embed?token=' + encodeURIComponent(token);
  f.title = 'Rewards';
  f.setAttribute('loading', 'lazy');
  f.style.cssText = 'width:100%;border:0;height:300px;display:block;background:transparent;color-scheme:normal';
  s.parentNode.insertBefore(f, s.nextSibling);
  window.addEventListener('message', function (e) {
    if (e.origin !== base || e.source !== f.contentWindow || !e.data || e.data.type !== 'blip-height') return;
    var h = Number(e.data.height);
    if (h > 0) f.style.height = Math.max(160, Math.min(1200, Math.round(h))) + 'px';
  });
})();
