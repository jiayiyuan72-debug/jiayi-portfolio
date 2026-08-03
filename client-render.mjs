import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
global.window = dom.window; global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.crypto = dom.window.crypto; global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element; global.Node = dom.window.Node;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
