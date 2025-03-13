export default class CustomVideoElement extends HTMLVideoElement {
  static readonly observedAttributes: string[];
  attributeChangedCallback(
    attrName: string,
    oldValue?: string | null,
    newValue?: string | null
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  config: {
    cc_lang_pref?: string;
    cc_load_policy?: 1;
    color?: 'red' | 'white';
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    origin?: string;
    playlist?: string;
    rel?: 0 | 1;
    start?: number;
    widget_referrer?: string;
  }
}
