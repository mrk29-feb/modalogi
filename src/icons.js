var ICONS = {
'ti-layers':'<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
'ti-pencil':'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
'ti-file-spreadsheet':'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h8M12 11v8"/>',
'ti-file-type-pdf':'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8 17v-4h1.5a1.2 1.2 0 0 1 0 2.4H8M13 17v-4h1a2 2 0 0 1 0 4z"/>',
'ti-upload':'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/>',
'ti-arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>','ti-arrow-left':'<path d="M19 12H5M11 6l-6 6 6 6"/>',
'ti-check':'<path d="M5 12.5l4.5 4.5L19 7"/>','ti-x':'<path d="M6 6l12 12M18 6L6 18"/>','ti-plus':'<path d="M12 5v14M5 12h14"/>',
'ti-trash':'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
'ti-circle-check':'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
'ti-alert-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
'ti-alert-triangle':'<path d="M12 4L3 19h18z"/><path d="M12 10v4M12 17v.01"/>',
'ti-refresh':'<path d="M19 12a7 7 0 1 1-2.2-5.1M19 4v4h-4"/>',
'ti-calculator':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
'ti-external-link':'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
'ti-lamp':'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3z"/>',
'ti-layout-board':'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/>',
'ti-building-factory-2':'<path d="M3 21V9l6 4V9l6 4V5h3a1 1 0 0 1 1 1v15z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
'ti-fish':'<path d="M3 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z"/><path d="M8 11.500v.01"/>',
'ti-plant-2':'<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2.500-5 6-5 0 3-2.500 5-6 5zM8 21h8"/>',
'ti-shopping-cart':'<circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/><path d="M3 4h2l2.500 11h10l2-8H6"/>',
'ti-tools':'<path d="M14.500 5.500a4 4 0 0 0 4 5.500L10 19.500a2 2 0 0 1-3-3L15.500 8M5 5l3 3M4 4l2 2"/>'
};
function ico(n) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '1.15em'); s.setAttribute('height', '1.15em'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.style.cssText = 'flex:none;vertical-align:-.2em';
  s.innerHTML = ICONS[n] || ''; return s;
}
