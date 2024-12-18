'use client';

import React from 'react';
import CustomMediaElement from '../{{{file_name}}}.js';
// keep as last import, ce-la-react is bundled.
import { createComponent } from 'ce-la-react';

export default createComponent({
  react: React,
  tagName: '{{{element_name}}}',
  elementClass: CustomMediaElement,
});
