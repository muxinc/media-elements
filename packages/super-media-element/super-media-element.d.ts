
export const Events: string[];

export const template: HTMLTemplateElement;

export class SuperAudioElement extends HTMLAudioElement implements HTMLAudioElement {
  static readonly observedAttributes: string[];
  readonly nativeEl: HTMLAudioElement;
  loadComplete?: Promise<void>;
  isLoaded: Boolean;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
}

export class SuperVideoElement extends HTMLVideoElement implements HTMLVideoElement {
  static readonly observedAttributes: string[];
  readonly nativeEl: HTMLVideoElement;
  loadComplete?: Promise<void>;
  isLoaded: Boolean;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
}

type SuperMediaElementConstructor<K> = {
  readonly observedAttributes: string[];
  Events: string[];
  template: HTMLTemplateElement;
  new(): K
};

export function SuperMediaMixin(Base: any, options: { tag: 'video', is: string }):
  SuperMediaElementConstructor<SuperVideoElement>;

export function SuperMediaMixin(Base: any, options: { tag: 'audio', is: string }):
  SuperMediaElementConstructor<SuperAudioElement>;
