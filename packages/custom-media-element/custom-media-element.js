/**
 * Custom Media Element
 * Based on https://github.com/muxinc/custom-video-element - Mux - MIT License
 *
 * The goal is to create an element that works just like the video element
 * but can be extended/sub-classed, because native elements cannot be
 * extended today across browsers.
 */

// The onevent like props are weirdly set on the HTMLElement prototype with other
// generic events making it impossible to pick these specific to HTMLMediaElement.
export const Events = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
  'waitingforkey',
  'resize',
  'enterpictureinpicture',
  'leavepictureinpicture',
  'webkitbeginfullscreen',
  'webkitendfullscreen',
  'webkitpresentationmodechanged',
];

function getAudioTemplateHTML(attrs) {
  return /*html*/ `
    <style>
      :host {
        display: inline-flex;
        line-height: 0;
        flex-direction: column;
        justify-content: end;
      }

      audio {
        width: 100%;
      }
    </style>
    <slot name="media">
      <audio${serializeAttributes(attrs)}></audio>
    </slot>
    <slot></slot>
  `;
}

// If the `media` slot is used leave the styling up to the user.
// It's a more consistent behavior pre and post custom element upgrade.

function getVideoTemplateHTML(attrs) {
  return /*html*/ `
    <style>
      :host {
        display: inline-block;
        line-height: 0;
      }

      video {
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
        min-height: 100%;
        object-fit: var(--media-object-fit, contain);
        object-position: var(--media-object-position, 50% 50%);
      }

      video::-webkit-media-text-track-container {
        transform: var(--media-webkit-text-track-transform);
        transition: var(--media-webkit-text-track-transition);
      }
    </style>
    <slot name="media">
      <video${serializeAttributes(attrs)}></video>
    </slot>
    <slot></slot>
  `;
}

/**
 * @see https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
 */
export const CustomMediaMixin = (superclass, { tag, is }) => {
  // `is` makes it possible to extend a custom built-in. e.g. castable-video
  const nativeElTest = globalThis.document?.createElement?.(tag, { is });
  const nativeElProps = nativeElTest ? getNativeElProps(nativeElTest) : [];

  return class CustomMedia extends superclass {
    static getTemplateHTML = tag.endsWith('audio') ? getAudioTemplateHTML : getVideoTemplateHTML;
    static shadowRootOptions = { mode: 'open' };
    static Events = Events;
    static #isDefined;

    static get observedAttributes() {
      CustomMedia.#define();

      // Include any attributes from the custom built-in.
      const natAttrs = nativeElTest?.constructor?.observedAttributes ?? [];

      return [
        ...natAttrs,
        'autopictureinpicture',
        'disablepictureinpicture',
        'disableremoteplayback',
        'autoplay',
        'controls',
        'controlslist',
        'crossorigin',
        'loop',
        'muted',
        'playsinline',
        'poster',
        'preload',
        'src',
      ];
    }

    static #define() {
      if (this.#isDefined) return;
      this.#isDefined = true;

      const propsToAttrs = new Set(this.observedAttributes);
      // defaultMuted maps to the muted attribute, handled manually below.
      propsToAttrs.delete('muted');

      // Passthrough native el functions from the custom el to the native el
      for (let prop of nativeElProps) {
        if (prop in this.prototype) continue;

        const type = typeof nativeElTest[prop];
        if (type == 'function') {
          // Function
          this.prototype[prop] = function (...args) {
            this.#init();

            const fn = () => {
              if (this.call) return this.call(prop, ...args);
              return this.nativeEl[prop].apply(this.nativeEl, args);
            };

            return fn();
          };
        } else {
          // Some properties like src, preload, defaultMuted are handled manually.

          // Getter
          let config = {
            get() {
              this.#init();

              let attr = prop.toLowerCase();
              if (propsToAttrs.has(attr)) {
                const val = this.getAttribute(attr);
                return val === null ? false : val === '' ? true : val;
              }

              return this.get?.(prop) ?? this.nativeEl?.[prop];
            },
          };

          if (prop !== prop.toUpperCase()) {
            // Setter (not a CONSTANT)
            config.set = function (val) {
              this.#init();

              let attr = prop.toLowerCase();
              if (propsToAttrs.has(attr)) {
                if (val === true || val === false || val == null) {
                  this.toggleAttribute(attr, Boolean(val));
                } else {
                  this.setAttribute(attr, val);
                }
                return;
              }

              if (this.set) {
                this.set(prop, val);
                return;
              }

              this.nativeEl[prop] = val;
            };
          }

          Object.defineProperty(this.prototype, prop, config);
        }
      }
    }

    #isInit;
    #nativeEl;
    #childMap = new Map();
    #childObserver;

    constructor() {
      super();

      // If the custom element is defined before the custom element's HTML is parsed
      // no attributes will be available in the constructor (construction process).
      // Wait until initializing in the attributeChangedCallback or
      // connectedCallback or accessing any properties.
    }

    get nativeEl() {
      this.#init();
      return (
        this.#nativeEl ??
        this.querySelector(':scope > [slot=media]') ??
        this.querySelector(tag) ??
        this.shadowRoot.querySelector(tag)
      );
    }

    set nativeEl(val) {
      this.#nativeEl = val;
    }

    get defaultMuted() {
      return this.hasAttribute('muted');
    }

    set defaultMuted(val) {
      this.toggleAttribute('muted', Boolean(val));
    }

    get src() {
      return this.getAttribute('src');
    }

    set src(val) {
      this.setAttribute('src', `${val}`);
    }

    get preload() {
      return this.getAttribute('preload') ?? this.nativeEl?.preload;
    }

    set preload(val) {
      this.setAttribute('preload', `${val}`);
    }

    #init() {
      if (this.#isInit) return;
      this.#isInit = true;
      this.init();
    }

    init() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });

        const attrs = namedNodeMapToObject(this.attributes);
        if (is) attrs.is = is;
        if (tag) attrs.part = tag;
        this.shadowRoot.innerHTML = this.constructor.getTemplateHTML(attrs);
      }

      // Neither Chrome or Firefox support setting the muted attribute
      // after using document.createElement.
      // Get around this by setting the muted property manually.
      this.nativeEl.muted = this.hasAttribute('muted');

      for (let prop of nativeElProps) {
        this.#upgradeProperty(prop);
      }

      this.#childObserver = new MutationObserver(this.#syncMediaChildAttribute);

      this.shadowRoot.addEventListener('slotchange', this);
      this.#syncMediaChildren();

      for (let type of this.constructor.Events) {
        this.shadowRoot.addEventListener?.(type, this, true);
      }
    }

    handleEvent(event) {
      if (event.type === 'slotchange') {
        this.#syncMediaChildren();
        return;
      }

      if (event.target === this.nativeEl) {
        // The video events are dispatched on the CustomMediaElement instance.
        // This makes it possible to add event listeners before the element is upgraded.
        this.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }));
      }
    }

    /**
     * Keep some native child elements like track and source in sync.
     * An unnamed <slot> will be filled with all of the custom element's
     * top-level child nodes that do not have the slot attribute.
     */
    #syncMediaChildren() {
      const removeNativeChildren = new Map(this.#childMap);

      this.shadowRoot
        .querySelector('slot:not([name])')
        .assignedElements({ flatten: true })
        .filter((el) => ['track', 'source'].includes(el.localName))
        .forEach((el) => {
          // If the source or track is still in the assigned elements keep it.
          removeNativeChildren.delete(el);
          // Re-use clones if possible.
          let clone = this.#childMap.get(el);
          if (!clone) {
            clone = el.cloneNode();
            this.#childMap.set(el, clone);
            this.#childObserver.observe(el, { attributes: true });
          }
          this.nativeEl.append?.(clone);
          this.#enableDefaultTrack(clone);
        });

      removeNativeChildren.forEach((clone, el) => {
        clone.remove();
        this.#childMap.delete(el);
      });
    }

    #syncMediaChildAttribute = (mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'attributes') {
          const { target, attributeName } = mutation;
          const clone = this.#childMap.get(target);
          clone?.setAttribute(attributeName, target.getAttribute(attributeName));
          this.#enableDefaultTrack(clone);
        }
      }
    };

    #enableDefaultTrack(trackEl) {
      // https://html.spec.whatwg.org/multipage/media.html#sourcing-out-of-band-text-tracks
      // If there are any text tracks in the media element's list of text
      // tracks whose text track kind is chapters or metadata that
      // correspond to track elements with a default attribute set whose
      // text track mode is set to disabled, then set the text track
      // mode of all such tracks to hidden.
      if (
        trackEl.localName === 'track' &&
        trackEl.default &&
        (trackEl.kind === 'chapters' || trackEl.kind === 'metadata') &&
        trackEl.track.mode === 'disabled'
      ) {
        trackEl.track.mode = 'hidden';
      }
    }

    #upgradeProperty(prop) {
      // Sets properties that are set before the custom element is upgraded.
      // https://web.dev/custom-elements-best-practices/#make-properties-lazy
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop];
        // Delete the set property from this instance.
        delete this[prop];
        // Set the value again via the (prototype) setter on this class.
        this[prop] = value;
      }
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      // Initialize right after construction when the attributes become available.
      this.#init();
      this.#forwardAttribute(attrName, oldValue, newValue);
    }

    #forwardAttribute(attrName, oldValue, newValue) {
      // Ignore a few that don't need to be passed.
      if (['id', 'class'].includes(attrName)) {
        return;
      }

      // Ignore setting custom attributes from the child class.
      // They should not have any effect on the native element, it adds noise in the DOM.
      if (
        !CustomMedia.observedAttributes.includes(attrName) &&
        this.constructor.observedAttributes.includes(attrName)
      ) {
        return;
      }

      if (newValue === null) {
        this.nativeEl.removeAttribute?.(attrName);
      } else {
        if (this.nativeEl.getAttribute?.(attrName) != newValue) {
          this.nativeEl.setAttribute?.(attrName, newValue);
        }
      }
    }

    connectedCallback() {
      this.#init();
    }
  };
};

function getNativeElProps(nativeElTest) {
  // Map all native element properties to the custom element
  // so that they're applied to the native element.
  // Skipping HTMLElement because of things like "attachShadow"
  // causing issues. Most of those props still need to apply to
  // the custom element.
  let nativeElProps = [];

  // Walk the prototype chain up to HTMLElement.
  // This will grab all super class props in between.
  // i.e. VideoElement and MediaElement
  for (
    let proto = Object.getPrototypeOf(nativeElTest);
    proto && proto !== HTMLElement.prototype;
    proto = Object.getPrototypeOf(proto)
  ) {
    nativeElProps.push(...Object.getOwnPropertyNames(proto));
  }

  return nativeElProps;
}

function serializeAttributes(attrs) {
  let html = '';
  for (const key in attrs) {
    const value = attrs[key];
    if (value === '') html += ` ${key}`;
    else html += ` ${key}="${value}"`;
  }
  return html;
}

function namedNodeMapToObject(namedNodeMap) {
  let obj = {};
  for (let attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
}

export const CustomVideoElement = CustomMediaMixin(globalThis.HTMLElement ?? class {}, {
  tag: 'video',
});

export const CustomAudioElement = CustomMediaMixin(globalThis.HTMLElement ?? class {}, {
  tag: 'audio',
});
