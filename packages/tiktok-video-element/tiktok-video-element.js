class TikTokVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static EMBED_BASE = 'https://www.tiktok.com/player/v1';
  static get observedAttributes() {
    return ['src', 'controls', 'loop', 'autoplay', 'muted'];
  }

  static PlayerState = { INIT: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.loadComplete = this._createPublicPromise();
    this._currentTime = 0;
    this._volume = 100;
    this._muted = false;
    this._paused = true;
    this.playerState = TikTokVideoElement.PlayerState.INIT;

    this._config = {};
    this._upgradeProperty?.('config');

    this._onMessage = this.handleMessage.bind(this);
  }

  connectedCallback() {
    window.addEventListener('message', this._onMessage);
    this.render();
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();

    if (name === 'muted') {
      if (newValue !== null && newValue !== 'false') {
        this.mute();
      } else {
        this.unMute();
      }
    }
  }

  _createPublicPromise() {
    let res, rej;
    const p = new Promise((r, j) => {
      res = r;
      rej = j;
    });
    p.resolve = res;
    p.reject = rej;
    return p;
  }

  get attrs() {
    return TikTokVideoElement.observedAttributes.reduce((o, attr) => {
      const val = this.getAttribute(attr);
      if (val !== null) o[attr] = val === '' ? '1' : val;
      return o;
    }, {});
  }

  async resolveVideoId() {
    const src = this.getAttribute('src');
    if (!src) return null;

    // 1. Direct numeric ID
    if (/^\d{10,}$/.test(src)) return src;

    // 2. player/v1 URLs
    let m = src.match(/player\/v1\/(\d+)/);
    if (m) return m[1];

    // 3. embed, share paths, shareId or item_id
    m = src.match(/(?:embed|v|usr|user)\/(\d+)/) || src.match(/[?&](?:shareId|item_id)=(\d+)/);
    if (m) return m[1];

    // 4. watch URLs including optional username
    m = src.match(/\/@[^/]*\/video\/(\d+)/);
    if (m) return m[1];

    // 5. /@/video/ format
    m = src.match(/\/@\/video\/(\d+)/);
    if (m) return m[1];

    // 6. Short links—resolve via HEAD redirect
    if (/vm\.tiktok\.com|vt\.tiktok\.com/.test(src)) {
      try {
        const resp = await fetch(src, { method: 'HEAD', redirect: 'follow' });
        const final = resp.url;
        m =
          final.match(/\/video\/(\d+)/) ||
          final.match(/player\/v1\/(\d+)/) ||
          final.match(/[?&](?:shareId|item_id)=(\d+)/);
        if (m) return m[1];
      } catch (e) {
        console.error('Error resolving short link', e);
      }
    }

    return null;
  }

  async render() {
    const id = await this.resolveVideoId();
    if (!id) return;

    this.loadComplete = this._createPublicPromise();

    const params = {
      controls: this.attrs.controls === undefined ? null : 1,
      autoplay: this.attrs.autoplay,
      loop: this.attrs.loop,
      rel: 0,
      ...this.config,
    };

    const src = `${TikTokVideoElement.EMBED_BASE}/${id}?${this.serialize(params)}`;
    const dataConfigAttr = this.config ? `data-config='${JSON.stringify(this.config).replace(/'/g, '&apos;')}'` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:inline-block;position:relative;width:100%;height:100%; }
        iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
      </style>
      <iframe src="${src}" ${dataConfigAttr} allow="autoplay; fullscreen" title="TikTok video"></iframe>
    `;

    this.iframe = this.shadowRoot.querySelector('iframe');

    if (this.hasAttribute('muted') && this.getAttribute('muted') !== 'false') {
      this.mute();
    }
  }

  get config() {
    return this._config;
  }

  set config(value) {
    this._config = value || {};
    this.render();
  }

  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  boolToBinary(props) {
    let p = {};
    for (let key in props) {
      let val = props[key];
      if (val === true || val === '') p[key] = 1;
      else if (val === false) p[key] = 0;
      else if (val != null) p[key] = val;
    }
    return p;
  }

  serialize(props) {
    return String(new URLSearchParams(this.boolToBinary(props)));
  }

  handleMessage(event) {
    const msg = event.data;
    if (!msg?.['x-tiktok-player']) return;

    switch (msg.type) {
      case 'onPlayerReady':
        this.loadComplete.resolve();
        break;

      case 'onStateChange':
        this.playerState = msg.value;
        this._paused = msg.value !== TikTokVideoElement.PlayerState.PLAYING;
        this.dispatchEvent(
          new Event(
            msg.value === TikTokVideoElement.PlayerState.PLAYING
              ? 'play'
              : msg.value === TikTokVideoElement.PlayerState.PAUSED
              ? 'pause'
              : msg.value === TikTokVideoElement.PlayerState.ENDED
              ? 'ended'
              : ''
          )
        );
        break;

      case 'onCurrentTime':
        this._currentTime = msg.value.currentTime;
        this._duration = msg.value.duration;
        this.dispatchEvent(new CustomEvent('durationchange', { detail: this._duration }));
        this.dispatchEvent(new CustomEvent('timeupdate', { detail: msg.value }));
        break;

      case 'onVolumeChange':
        this._volume = msg.value;
        this.dispatchEvent(new CustomEvent('volumechange', { detail: msg.value }));
        if (msg.value === 0) {
          this._muted = true;
        } else {
          this._muted = false;
        }
        break;

      case 'onMute':
        this._muted = msg.value ? true : false;
        this.dispatchEvent(new CustomEvent('volumechange', { detail: this._volume }));
        break;

      case 'onError':
        this.dispatchEvent(new CustomEvent('error', { detail: msg.value }));
        break;

      default:
        console.warn('Unhandled TikTok player message:', msg);
        break;
    }
  }

  _post(type, value) {
    if (!this.iframe?.contentWindow) return;
    const message = { 'x-tiktok-player': true, type, ...(value !== undefined ? { value } : {}) };
    this.iframe.contentWindow.postMessage(message, '*');
  }

  async play() {
    await this.loadComplete;
    this._post('play');
  }

  async pause() {
    await this.loadComplete;
    this._post('pause');
  }

  async seekTo(sec) {
    await this.loadComplete;
    this._post('seekTo', Number(sec));
  }

  async mute() {
    await this.loadComplete;
    this._muted = true;
    this._post('mute');
  }

  async unMute() {
    await this.loadComplete;
    this._muted = false;
    this._post('unMute');
  }

  async changeVolume(val) {
    await this.loadComplete;
    this._post('changeVolume', Math.round(Number(val)));
  }

  get currentTime() {
    return this._currentTime;
  }
  set currentTime(val) {
    this.seekTo(val);
  }

  get volume() {
    return this._volume / 100;
  }
  set volume(val) {
    this.changeVolume(val * 100);
  }

  get muted() {
    return this._muted;
  }

  set muted(val) {
    if (this.muted == val) return;
    val ? this.mute() : this.unMute();
  }

  get paused() {
    return this._paused;
  }

  get duration() {
    return this._duration;
  }
}

if (globalThis.customElements && !globalThis.customElements.get('tiktok-video')) {
  globalThis.customElements.define('tiktok-video', TikTokVideoElement);
}

export default TikTokVideoElement;
