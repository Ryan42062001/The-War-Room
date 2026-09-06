/**
 * The War Room production bootstrap.
 *
 * Production logic lives in ordered classic scripts under js/. Keeping this
 * final trigger separate ensures all function declarations are available before
 * initialization, preserving the original monolith's hoisting behavior.
 */

function loadDraftCommandPresentation() {
  if (document.querySelector('script[data-war-room-command-bar]')) return;

  var script = document.createElement('script');
  script.src = 'js/war-room-command-bar.js?v=20260906-1';
  script.setAttribute('data-war-room-command-bar', 'true');
  script.onload = function() {
    if (typeof window.initDraftCommandBar === 'function') {
      window.initDraftCommandBar();
    }
  };
  document.head.appendChild(script);
}

function bootWarRoom() {
  runAppInitialization();
  loadDraftCommandPresentation();
}

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    bootWarRoom,
    { once: true }
  );

} else {

  bootWarRoom();

}
