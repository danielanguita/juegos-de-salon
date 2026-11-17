// A double tap, as an impatient thumb makes it (C-14, D-576): two clicks on the same button 60 ms apart, the second
// one on whatever answers to the selector by then. A button that waits on an animation before it acts must take
// the first tap only; a game's e2e script calls this on each such button and then checks the screen is sane.
export const doubleTap = (b, selector, gap = 60) => b.evaluate(`(async () => {
  const tap = () => document.querySelector(${JSON.stringify(selector)})?.click();
  tap(); await new Promise(r => setTimeout(r, ${gap})); tap(); return 1;
})()`);
