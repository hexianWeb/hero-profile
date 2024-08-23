/*
 * @Author: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Date: 2024-07-26 16:32:40
 * @LastEditTime: 2024-08-22 17:12:09
 * @LastEditors: F1686533 mcebg-mac1-spprd@mail.foxconn.com
 * @Description:
 * @FilePath: \vite-three-js\src\js\index.js
 * Copyright (c) 2024 by Foxconn MAC(I) network application development, All Rights Reserved.
 */
import '../css/global.css';
import '../css/container.css';
import '../scss/global.scss';
import gsap from 'gsap';
import SplitTextJS from 'split-text-js';
import Three from './three';

const title = gsap.utils.toArray('li');
// console.log(title);
const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.1 });
title.forEach((title) => {
  const splitTitle = new SplitTextJS(title, {
    type: 'words,chars',
    linesClass: 'title-line',
    charsClass: 'title-char'
  });

  tl.from(
    splitTitle.chars,
    {
      opacity: 0,
      y: 80,
      rotateX: -90,
      stagger: 0.02
    },
    '<'
  ).to(
    splitTitle.chars,
    {
      opacity: 0,
      y: -80,
      rotateX: 90,
      stagger: 0.02
    },
    '<1'
  );
});

document.addEventListener('DOMContentLoaded', () => {});

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
});

