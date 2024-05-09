'use client';

import React, { useRef, useEffect } from 'react';
import Element from '../{{{file_name}}}.js';

export default React.forwardRef(({ children, ...props }, ref) => {
  ref ??= useRef();

  const attrs = propsToAttrs({ ...props, ref });

  for (let propName in props) {
    if (/^on[A-Z]/.test(propName)) {
      const type = propName.slice(2).toLowerCase();
      const callback = props[propName];

      useEffect(() => {
        const eventTarget = ref?.current;
        if (!eventTarget || !callback) return;
        eventTarget.addEventListener(type, callback);
        return () => {
          eventTarget.removeEventListener(type, callback);
        };
      }, [ref?.current, callback]);
    }
  }

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

  return React.createElement('{{{element_name}}}', attrs, ...[].concat(children));
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
  if (/^on[A-Z]/.test(propName)) return undefined;
  if (/[A-Z]/.test(propName)) return propName.toLowerCase();
  return propName;
}

function toAttrValue(propValue) {
  if (typeof propValue === 'boolean') return '';
  if (Array.isArray(propValue)) return propValue.join(' ');
  return propValue;
}
