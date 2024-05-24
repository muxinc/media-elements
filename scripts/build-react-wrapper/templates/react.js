'use client';

import React, { useRef, useEffect } from 'react';
import Element from '../{{{file_name}}}.js';

export default React.forwardRef((allProps, ref) => {
  let { children, suppressHydrationWarning, ...props } = allProps;
  ref ??= useRef();

  for (let name in props) {
    if (name[0] === 'o' && name[1] === 'n') {
      const useCapture = name.endsWith('Capture');
      const eventName = name.slice(2, useCapture ? name.length - 7 : undefined);
      const callback = props[name];

      useEffect(() => {
        const eventTarget = ref?.current;
        if (!eventTarget || typeof callback !== 'function') return;

        eventTarget.addEventListener(eventName, callback, useCapture);

        return () => {
          eventTarget.removeEventListener(eventName, callback, useCapture);
        };
      }, [ref?.current, callback]);
    }
  }

  const attrs = propsToAttrs(props);

  // Only render the custom element template HTML on the server..
  // The custom element will render itself on the client.
  if (typeof window === 'undefined' && Element?.getTemplateHTML && Element?.shadowRootOptions) {
    const { mode, delegatesFocus } = Element.shadowRootOptions;

    const templateShadowRoot = React.createElement('template', {
      shadowrootmode: mode,
      shadowrootdelegatesfocus: delegatesFocus,
      dangerouslySetInnerHTML: {
        __html: Element.getTemplateHTML(attrs),
      },
    });

    children = [templateShadowRoot, children];
  }

  return React.createElement('{{{element_name}}}', {
    ...attrs,
    ref,
    children,
    suppressHydrationWarning,
  });
});

const ReactPropToAttrNameMap = {
  className: 'class',
  classname: 'class',
  htmlFor: 'for',
  viewBox: 'viewBox',
};

function propsToAttrs(props = {}) {
  let attrs = {};
  for (let [propName, propValue] of Object.entries(props)) {
    let attrName = toAttrName(propName, propValue);
    if (attrName) attrs[attrName] = toAttrValue(propValue);
  }
  return attrs;
}

function toAttrName(propName, propValue) {
  if (ReactPropToAttrNameMap[propName]) return ReactPropToAttrNameMap[propName];
  if (typeof propValue == 'undefined') return undefined;
  if (typeof propValue === 'boolean' && !propValue) return undefined;
  if (propName.startsWith('on') && typeof propValue === 'function') return undefined;
  if (/[A-Z]/.test(propName)) return propName.toLowerCase();
  return propName;
}

function toAttrValue(propValue) {
  if (typeof propValue === 'boolean') return '';
  if (Array.isArray(propValue)) return propValue.join(' ');
  return propValue;
}
