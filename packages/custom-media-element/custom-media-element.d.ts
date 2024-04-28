
export const Events: string[];

export const audioTemplate: HTMLTemplateElement;
export const videoTemplate: HTMLTemplateElement;

export class CustomAudioElement extends HTMLAudioElement implements HTMLAudioElement {
  static readonly observedAttributes: string[];
  static Events: string[];
  static template: HTMLTemplateElement;
  readonly nativeEl: HTMLAudioElement;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  init(): void;
  handleEvent(event: Event): void;
}

export class CustomVideoElement extends HTMLVideoElement implements HTMLVideoElement {
  static readonly observedAttributes: string[];
  static Events: string[];
  static template: HTMLTemplateElement;
  readonly nativeEl: HTMLVideoElement;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  init(): void;
  handleEvent(event: Event): void;
}

export type CustomMediaElementConstructor<T> = {
  readonly observedAttributes: string[];
  Events: string[];
  template: HTMLTemplateElement;
  new(): T;
};

export type CustomVideoElementConstructor = CustomMediaElementConstructor<CustomVideoElement>;
export type CustomAudioElementConstructor = CustomMediaElementConstructor<CustomAudioElement>;

export function CustomMediaMixin<T = HTMLElement>(superclass: T, options: { tag: 'video', is?: string }):
  T & CustomVideoElementConstructor;

export function CustomMediaMixin<T = HTMLElement>(superclass: T, options: { tag: 'audio', is?: string }):
  T & CustomAudioElementConstructor;
