/**
 * Copy text to the clipboard. Returns true on success, false on failure.
 *
 * Why the fallback: browsers only provide `navigator.clipboard` on secure pages
 * (HTTPS or localhost). The dashboard is served over plain HTTP on the VPS IP,
 * where `navigator.clipboard` is undefined. In that case we use the older
 * trick: put the text in a hidden <textarea>, select it, and run the "copy" command.
 */
export async function copyText(text) {
  // 1. Modern API (HTTPS / localhost)
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Permission denied etc. -> try the fallback below
    }
  }

  // 2. Fallback for plain HTTP
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed'; // avoid scrolling the page
  textarea.style.top = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length); // needed on iOS

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (_) {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
