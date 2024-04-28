'use client';

import React from 'react';
import './{{{file_name}}}.js';

export default React.forwardRef(({ children = [], ...props }, ref) => {
  return React.createElement(
    '{{{element_name}}}',
    toNativeProps({ ...props, ref }),
    children
  );
});

const ReactPropToAttrNameMap = {
  className: 'class',
  classname: 'class',
  htmlFor: 'for',
  crossOrigin: 'crossorigin',
  viewBox: 'viewBox',
};

export const toNativeAttrName = (propName, propValue) => {
  if (ReactPropToAttrNameMap[propName]) return ReactPropToAttrNameMap[propName];
  if (typeof propValue == 'undefined') return undefined;
  if (typeof propValue === 'boolean' && !propValue) return undefined;
  if (/[A-Z]/.test(propName)) return propName.toLowerCase();
  return propName;
};

export const toNativeAttrValue = (propValue) => {
  if (typeof propValue === 'boolean') return '';
  if (Array.isArray(propValue)) return propValue.join(' ');
  return propValue;
};

export const toNativeProps = (props = {}) => {
  return Object.entries(props).reduce(
    (transformedProps, [propName, propValue]) => {
      const attrName = toNativeAttrName(propName, propValue);

      if (!attrName) {
        return transformedProps;
      }

      const attrValue = toNativeAttrValue(propValue, propName);
      transformedProps[attrName] = attrValue;
      return transformedProps;
    },
    {}
  );
};
