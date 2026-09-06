/**
 * The War Room production bootstrap.
 *
 * Production logic lives in ordered classic scripts under js/. Keeping this
 * final trigger separate ensures all function declarations are available before
 * initialization, preserving the original monolith's hoisting behavior.
 */

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    runAppInitialization,
    { once: true }
  );

} else {

  runAppInitialization();

}
