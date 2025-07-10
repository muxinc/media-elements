export default class CustomAudioElement extends HTMLAudioElement {
  static readonly observedAttributes: string[];
  attributeChangedCallback(
    attrName: string,
    oldValue?: string | null,
    newValue?: string | null
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  config: {
    startAt?: number;
    theme?: 'dark' | 'light';
    preferVideo?: boolean;
  };
}
