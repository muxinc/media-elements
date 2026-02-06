'use client';

import React from 'react';
import CustomMediaElement from './{{{file_name}}}.js';
// keep as last import, ce-la-react is bundled.
import { createComponent, defaultToAttributeName } from 'ce-la-react';

export default createComponent({
  react: React,
  tagName: '{{{element_name}}}',
  elementClass: CustomMediaElement,
  toAttributeName(propName) {
    // The HTMLMediaElement.muted property doesn't have a corresponding attribute.
    // The muted attribute corresponds to the HTMLMediaElement.defaultMuted property.
    if (propName === 'muted') return '';
    if (propName === 'defaultMuted') return 'muted';
    return defaultToAttributeName(propName);
  },
});
