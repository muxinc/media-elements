// https://wistia.com/support/developers/player-api
import { SuperVideoElement } from 'super-media-element';

const templateLightDOM = globalThis.document?.createElement('template');
if (templateLightDOM) {
  templateLightDOM.innerHTML = /*html*/`
  <div class="wistia_embed"></div>
  `;
}

const templateShadowDOM = globalThis.document?.createElement('template');
if (templateShadowDOM) {
  templateShadowDOM.innerHTML = /*html*/`
  <style>
    :host {
      display: inline-block;
      min-width: 300px;
      min-height: 150px;
      position: relative;
    }
    ::slotted(.wistia_embed) {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  </style>
  <slot></slot>
  `;
}

class WistiaVideoElement extends SuperVideoElement {
  static template = templateShadowDOM;
  static skipAttributes = ['src'];

  get nativeEl() {
    return this.api?.elem() ?? this.querySelector('video');
  }

  async load() {
    // Cleanup the previous video container.
    this.querySelector('.wistia_embed')?.remove();

    if (!this.src) {
      return;
    }

    const MATCH_SRC = /(?:wistia\.com|wi\.st)\/(?:medias|embed)\/(.*)$/i;
    const id = this.src.match(MATCH_SRC)[1];
    const options = {
      autoPlay: this.autoplay,
      preload: this.preload ?? 'metadata',
      playsinline: this.playsInline,
      endVideoBehavior: this.loop && 'loop',
      chromeless: !this.controls,
      playButton: this.controls,
      muted: this.defaultMuted,
    };

    // Sadly the setup/render will not work in the shadow DOM.
    this.append(templateLightDOM.content.cloneNode(true));

    const div = this.querySelector('.wistia_embed');
    if (!div.id) div.id = uniqueId(id);
    div.classList.add(`wistia_async_${id}`);

    const scriptUrl = 'https://fast.wistia.com/assets/external/E-v1.js';
    await loadScript(scriptUrl, 'Wistia');

    this.api = await new Promise((onReady) => {
      globalThis._wq.push({
        id: div.id,
        onReady,
        options,
      });
    });
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {

    if (attrName === 'controls') {
      await this.loadComplete;

      switch (attrName) {
        case 'controls':
          this.api.bigPlayButtonEnabled(this.controls);
          this.controls
            ? this.api.releaseChromeless()
            : this.api.requestChromeless();
          break;
      }
      return;
    }

    super.attributeChangedCallback(attrName, oldValue, newValue);
  }

  // Override some methods w/ defaults if the video element is not ready yet when called.
  // Some methods require the Wistia API instead of the native video element API.

  get duration() {
    return this.api?.duration();
  }

  play() {
    // wistia.play doesn't return a play promise.
    this.api.play();
    return new Promise((resolve) => this.addEventListener('playing', resolve));
  }
}

const loadScriptCache = {};
async function loadScript(src, globalName) {
  if (!globalName) return import(/* webpackIgnore: true */ src);
  if (loadScriptCache[src]) return loadScriptCache[src];
  if (self[globalName]) return self[globalName];
  return (loadScriptCache[src] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.defer = true;
    script.src = src;
    script.onload = () => resolve(self[globalName]);
    script.onerror = reject;
    document.head.append(script);
  }));
}

let idCounter = 0;
export function uniqueId(prefix) {
  const id = ++idCounter;
  return `${prefix}${id}`;
}

if (globalThis.customElements && !globalThis.customElements.get('wistia-video')) {
  globalThis.customElements.define('wistia-video', WistiaVideoElement);
}

export default WistiaVideoElement;
