/**
 * Design Token Extractor
 * Injected via Playwright browser_evaluate to extract colors, fonts, button styles,
 * form inputs, breadcrumb, and navigation from a page.
 * Returns a JSON object with all extracted design tokens.
 */
(() => {
  const result = {
    url: window.location.href,
    title: document.title,
    colors: {},
    typography: {},
    buttons: {},
    forms: {},
    breadcrumb: {},
    navigation: {},
    accordion: {},
    meta: {
      extractedAt: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    },
  };

  // ── Helpers ──

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function getComputedStyleProp(el, prop) {
    return window.getComputedStyle(el).getPropertyValue(prop).trim();
  }

  function pxToRem(pxValue, rootFontSize) {
    const px = parseFloat(pxValue);
    if (isNaN(px)) return pxValue;
    return (px / rootFontSize).toFixed(3).replace(/\.?0+$/, '') + 'rem';
  }

  // ── 1. Extract Colors ──

  const colorMap = new Map(); // hex → count
  const bgColorMap = new Map();
  const borderColorMap = new Map();

  const allElements = document.querySelectorAll('body *');
  const sampleSize = Math.min(allElements.length, 2000);
  const step = Math.max(1, Math.floor(allElements.length / sampleSize));

  for (let i = 0; i < allElements.length; i += step) {
    const el = allElements[i];
    const style = window.getComputedStyle(el);

    // Text color
    const color = rgbToHex(style.color);
    if (color) colorMap.set(color, (colorMap.get(color) || 0) + 1);

    // Background color
    const bg = rgbToHex(style.backgroundColor);
    if (bg) bgColorMap.set(bg, (bgColorMap.get(bg) || 0) + 1);

    // Border color
    const border = rgbToHex(style.borderTopColor);
    if (border && border !== color) {
      borderColorMap.set(border, (borderColorMap.get(border) || 0) + 1);
    }
  }

  // Sort by frequency and take top colors
  const sortByFreq = (map, limit = 20) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([hex, count]) => ({ hex, count }));

  result.colors.text = sortByFreq(colorMap);
  result.colors.background = sortByFreq(bgColorMap);
  result.colors.border = sortByFreq(borderColorMap);

  // Extract link colors
  const links = document.querySelectorAll('a');
  const linkColors = new Map();
  links.forEach(a => {
    const c = rgbToHex(window.getComputedStyle(a).color);
    if (c) linkColors.set(c, (linkColors.get(c) || 0) + 1);
  });
  result.colors.links = sortByFreq(linkColors, 10);

  // CSS custom properties from :root
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVars = {};
  const varNames = [
    '--bs-primary', '--bs-secondary', '--bs-success', '--bs-info',
    '--bs-warning', '--bs-danger', '--bs-light', '--bs-dark',
    '--bs-body-color', '--bs-body-bg', '--bs-link-color',
    '--bs-border-color',
  ];
  varNames.forEach(name => {
    const val = rootStyles.getPropertyValue(name).trim();
    if (val) cssVars[name] = val.startsWith('#') ? val : rgbToHex(val) || val;
  });
  result.colors.cssVariables = cssVars;

  // ── 2. Extract Typography ──

  const rootFontSize = parseFloat(getComputedStyleProp(document.documentElement, 'font-size'));
  result.typography.rootFontSize = rootFontSize + 'px';

  // Body font
  const body = document.body;
  const bodyStyle = window.getComputedStyle(body);
  const bodyLineHeightPx = parseFloat(bodyStyle.lineHeight);
  result.typography.body = {
    fontFamily: bodyStyle.fontFamily,
    fontSize: bodyStyle.fontSize,
    fontSizeRem: pxToRem(bodyStyle.fontSize, rootFontSize),
    fontWeight: bodyStyle.fontWeight,
    lineHeight: bodyStyle.lineHeight,
    lineHeightRatio: isNaN(bodyLineHeightPx) ? null : +(bodyLineHeightPx / parseFloat(bodyStyle.fontSize)).toFixed(3),
    color: rgbToHex(bodyStyle.color),
  };

  // Heading styles (h1-h6)
  result.typography.headings = {};
  for (let i = 1; i <= 6; i++) {
    const heading = document.querySelector(`h${i}`);
    if (heading) {
      const hs = window.getComputedStyle(heading);
      result.typography.headings[`h${i}`] = {
        fontSize: hs.fontSize,
        fontSizeRem: pxToRem(hs.fontSize, rootFontSize),
        fontWeight: hs.fontWeight,
        lineHeight: hs.lineHeight,
        letterSpacing: hs.letterSpacing,
        color: rgbToHex(hs.color),
        fontFamily: hs.fontFamily !== bodyStyle.fontFamily ? hs.fontFamily : null,
      };
    }
  }

  // Detect used font families
  const fontFamilies = new Map();
  for (let i = 0; i < allElements.length; i += step) {
    const ff = window.getComputedStyle(allElements[i]).fontFamily;
    if (ff) fontFamilies.set(ff, (fontFamilies.get(ff) || 0) + 1);
  }
  result.typography.usedFonts = [...fontFamilies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([family, count]) => ({ family, count }));

  // ── 3. Extract Button Styles ──

  const buttonSelectors = [
    'button', '.btn', 'a.btn', 'input[type="submit"]', 'input[type="button"]',
    '[class*="btn-"]', '[role="button"]',
  ];

  const buttonStyles = new Map();

  buttonSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(btn => {
      const bs = window.getComputedStyle(btn);
      const key = [
        rgbToHex(bs.backgroundColor),
        rgbToHex(bs.color),
        bs.borderRadius,
        bs.fontSize,
        bs.paddingTop + ' ' + bs.paddingRight + ' ' + bs.paddingBottom + ' ' + bs.paddingLeft,
      ].join('|');

      if (!buttonStyles.has(key)) {
        const classes = [...btn.classList].filter(c => c.startsWith('btn')).join(' ');
        buttonStyles.set(key, {
          text: btn.textContent.trim().substring(0, 50),
          classes: classes || btn.tagName.toLowerCase(),
          backgroundColor: rgbToHex(bs.backgroundColor),
          color: rgbToHex(bs.color),
          borderColor: rgbToHex(bs.borderTopColor),
          borderWidth: bs.borderTopWidth,
          borderRadius: bs.borderRadius,
          borderRadiusRem: pxToRem(bs.borderRadius, rootFontSize),
          fontSize: bs.fontSize,
          fontSizeRem: pxToRem(bs.fontSize, rootFontSize),
          fontWeight: bs.fontWeight,
          padding: {
            top: bs.paddingTop,
            right: bs.paddingRight,
            bottom: bs.paddingBottom,
            left: bs.paddingLeft,
          },
          paddingRem: {
            y: pxToRem(bs.paddingTop, rootFontSize),
            x: pxToRem(bs.paddingRight, rootFontSize),
          },
          textTransform: bs.textTransform,
          letterSpacing: bs.letterSpacing,
          boxShadow: bs.boxShadow !== 'none' ? bs.boxShadow : null,
        });
      }
    });
  });

  result.buttons.styles = [...buttonStyles.values()];
  result.buttons.count = result.buttons.styles.length;

  // ── 4. Extract Form Input Styles ──

  const inputSelectors = 'input[type="text"], input[type="email"], input[type="tel"], input[type="password"], input:not([type]), textarea, select';
  const inputStyleMap = new Map();

  document.querySelectorAll(inputSelectors).forEach(inp => {
    const rect = inp.getBoundingClientRect();
    if (rect.height <= 0 || rect.height > 200) return;
    const is = window.getComputedStyle(inp);
    const key = [is.fontSize, is.backgroundColor, is.borderTopColor, is.borderTopWidth, is.borderRadius, is.paddingTop, is.paddingLeft].join('|');
    if (!inputStyleMap.has(key)) {
      inputStyleMap.set(key, {
        tag: inp.tagName,
        height: Math.round(rect.height),
        fontSize: is.fontSize,
        fontSizeRem: pxToRem(is.fontSize, rootFontSize),
        fontWeight: is.fontWeight,
        color: rgbToHex(is.color),
        backgroundColor: rgbToHex(is.backgroundColor),
        borderColor: rgbToHex(is.borderTopColor),
        borderWidth: is.borderTopWidth,
        borderRadius: is.borderRadius,
        borderRadiusRem: pxToRem(is.borderRadius, rootFontSize),
        paddingY: is.paddingTop,
        paddingX: is.paddingLeft,
        paddingYrem: pxToRem(is.paddingTop, rootFontSize),
        paddingXrem: pxToRem(is.paddingLeft, rootFontSize),
        lineHeight: is.lineHeight,
      });
    }
  });
  result.forms.styles = [...inputStyleMap.values()];
  result.forms.count = result.forms.styles.length;

  // Interactive states — check CSS rules for hover, focus, active on .form-control
  // (getComputedStyle with programmatic focus/hover doesn't always reflect :pseudo-class rules)
  const interactiveStates = { hover: {}, focus: {}, active: {} };
  try {
    const sheets = [...document.styleSheets];
    sheets.forEach(sheet => {
      try {
        [...sheet.cssRules].forEach(rule => {
          if (!rule.selectorText) return;
          const sel = rule.selectorText;
          const isFormControl = sel.includes('.form-control') || sel.includes('input[type');
          if (!isFormControl) return;

          ['hover', 'focus', 'active'].forEach(state => {
            if (sel.includes(':' + state)) {
              const s = rule.style;
              if (s.backgroundColor) {
                // Resolve CSS variables
                let bg = s.backgroundColor;
                if (bg.startsWith('var(')) {
                  const varName = bg.match(/var\(([^)]+)\)/);
                  if (varName) {
                    const resolved = getComputedStyle(document.body).getPropertyValue(varName[1]).trim();
                    if (resolved) bg = resolved;
                  }
                }
                interactiveStates[state].backgroundColor = bg;
              }
              if (s.borderColor) interactiveStates[state].borderColor = s.borderColor;
              if (s.boxShadow && s.boxShadow !== 'none') interactiveStates[state].boxShadow = s.boxShadow;
              if (s.color) interactiveStates[state].color = s.color;
              if (s.outline) interactiveStates[state].outline = s.outline;
            }
          });
        });
      } catch(e) { /* cross-origin sheet */ }
    });
  } catch(e) {}

  // Also try programmatic focus for computed values
  const firstInput = document.querySelector(inputSelectors);
  if (firstInput && firstInput.getBoundingClientRect().height > 0) {
    const blurStyle = window.getComputedStyle(firstInput);
    const blurBg = blurStyle.backgroundColor;
    const blurBorder = blurStyle.borderTopColor;
    const blurShadow = blurStyle.boxShadow;
    firstInput.focus();
    const focusStyle = window.getComputedStyle(firstInput);
    const focusComputed = {
      backgroundColor: rgbToHex(focusStyle.backgroundColor),
      borderColor: rgbToHex(focusStyle.borderTopColor),
      boxShadow: focusStyle.boxShadow !== 'none' ? focusStyle.boxShadow : null,
      color: rgbToHex(focusStyle.color),
      bgChanged: focusStyle.backgroundColor !== blurBg,
      borderChanged: focusStyle.borderTopColor !== blurBorder,
      shadowChanged: focusStyle.boxShadow !== blurShadow,
    };
    firstInput.blur();

    // Merge: CSS rules take priority (they show what browser actually applies)
    result.forms.focus = {
      ...focusComputed,
      ...(Object.keys(interactiveStates.focus).length > 0 ? { cssRule: interactiveStates.focus } : {}),
    };
  }

  // Hover and active from CSS rules only (can't programmatically trigger :hover/:active)
  if (Object.keys(interactiveStates.hover).length > 0) {
    result.forms.hover = interactiveStates.hover;
  }
  if (Object.keys(interactiveStates.active).length > 0) {
    result.forms.active = interactiveStates.active;
  }

  // ── 5. Extract Breadcrumb ──

  const bcEl = document.querySelector('[class*="breadcrumb"], nav[aria-label="breadcrumb"]');
  if (bcEl) {
    const bcLinks = bcEl.querySelectorAll('a');
    if (bcLinks.length > 0) {
      const linkStyle = window.getComputedStyle(bcLinks[0]);
      result.breadcrumb.linkColor = rgbToHex(linkStyle.color);
      result.breadcrumb.linkFontSize = linkStyle.fontSize;
      result.breadcrumb.linkFontWeight = linkStyle.fontWeight;
    }
    // Divider / separator color
    const allSpans = bcEl.querySelectorAll('span, li');
    allSpans.forEach(sp => {
      const txt = sp.textContent.trim();
      if (['—', '/', '>', '»', '·', '|'].includes(txt)) {
        result.breadcrumb.dividerColor = rgbToHex(window.getComputedStyle(sp).color);
        result.breadcrumb.divider = txt;
      }
    });
    // Active (last) item
    const lastItem = bcEl.querySelector('li:last-child, span:last-child');
    if (lastItem && !lastItem.querySelector('a')) {
      result.breadcrumb.activeColor = rgbToHex(window.getComputedStyle(lastItem).color);
    }
  }

  // ── 6. Extract Navigation ──

  const navEl = document.querySelector('nav, [class*="navbar"], [class*="main-nav"], [class*="header-menu"]');
  if (navEl) {
    const navLinks = navEl.querySelectorAll('a');
    if (navLinks.length > 0) {
      const ns = window.getComputedStyle(navLinks[0]);
      result.navigation = {
        fontSize: ns.fontSize,
        fontSizeRem: pxToRem(ns.fontSize, rootFontSize),
        fontWeight: ns.fontWeight,
        color: rgbToHex(ns.color),
        textTransform: ns.textTransform,
        letterSpacing: ns.letterSpacing,
      };
    }
  }

  // ── 7. Extract Accordion Styles ──

  const accordionSelectors = [
    '.accordion', '.accordion-wrapper', '[class*="accordion"]',
    '.collapse-wrapper', '.faq', '[class*="toggle"]', '.panel-group',
  ];

  let accordionContainer = null;
  for (const sel of accordionSelectors) {
    accordionContainer = document.querySelector(sel);
    if (accordionContainer) break;
  }

  if (accordionContainer) {
    // Find all accordion containers for variant detection
    const allAccordions = document.querySelectorAll(accordionSelectors.join(', '));

    // --- Header / Button ---
    const headerSelectors = [
      '.accordion-button', '.card-header button', '.card-header a',
      '.accordion-header button', '.accordion-header a',
      '.panel-heading a', '.panel-title a',
      '[data-toggle="collapse"]', '[data-bs-toggle="collapse"]',
      '.collapse-link', '.toggle-title',
    ];

    let firstHeader = null;
    for (const sel of headerSelectors) {
      firstHeader = accordionContainer.querySelector(sel);
      if (firstHeader) break;
    }

    if (firstHeader) {
      const hs = window.getComputedStyle(firstHeader);

      // IMPORTANT: Check inner text elements (span, a, strong) — they may have
      // different font-size/weight than the container element itself.
      const innerTextEl = firstHeader.querySelector('span, a, strong, b, em');
      let textFontSize = hs.fontSize;
      let textFontSizeRem = pxToRem(hs.fontSize, rootFontSize);
      let textFontWeight = hs.fontWeight;
      if (innerTextEl) {
        const its = window.getComputedStyle(innerTextEl);
        textFontSize = its.fontSize;
        textFontSizeRem = pxToRem(its.fontSize, rootFontSize);
        textFontWeight = its.fontWeight;
      }

      result.accordion.button = {
        fontSize: textFontSize,
        fontSizeRem: textFontSizeRem,
        fontWeight: textFontWeight,
        containerFontSize: hs.fontSize,
        containerFontWeight: hs.fontWeight,
        hasInnerTextEl: !!innerTextEl,
        color: rgbToHex(hs.color),
        backgroundColor: rgbToHex(hs.backgroundColor),
        padding: {
          top: hs.paddingTop,
          right: hs.paddingRight,
          bottom: hs.paddingBottom,
          left: hs.paddingLeft,
        },
        paddingRem: {
          top: pxToRem(hs.paddingTop, rootFontSize),
          right: pxToRem(hs.paddingRight, rootFontSize),
          bottom: pxToRem(hs.paddingBottom, rootFontSize),
          left: pxToRem(hs.paddingLeft, rootFontSize),
        },
        paddingYEqual: hs.paddingTop === hs.paddingBottom,
        textTransform: hs.textTransform,
        letterSpacing: hs.letterSpacing,
        lineHeight: hs.lineHeight,
      };

      // --- Icon (::before or ::after pseudo-element) ---
      const beforeStyle = window.getComputedStyle(firstHeader, '::before');
      const afterStyle = window.getComputedStyle(firstHeader, '::after');

      // Determine which pseudo-element is the icon
      let iconPseudo = null;
      let iconPosition = 'none';

      const beforeContent = beforeStyle.getPropertyValue('content');
      const afterContent = afterStyle.getPropertyValue('content');
      const hasBeforeIcon = beforeContent && beforeContent !== 'none' && beforeContent !== '""' && beforeContent !== "''";
      const hasAfterIcon = afterContent && afterContent !== 'none' && afterContent !== '""' && afterContent !== "''";

      if (hasBeforeIcon) {
        iconPseudo = beforeStyle;
        iconPosition = 'left';
      } else if (hasAfterIcon) {
        iconPseudo = afterStyle;
        iconPosition = 'right';
      }

      // Check for <i> or <svg> icon inside the button
      const iconEl = firstHeader.querySelector('i, svg, [class*="icon"], [class*="fa-"]');
      if (iconEl && !iconPseudo) {
        const iconS = window.getComputedStyle(iconEl);
        const iconRect = iconEl.getBoundingClientRect();
        const headerRect = firstHeader.getBoundingClientRect();
        // Determine position based on element location
        const iconCenterX = iconRect.left + iconRect.width / 2;
        const headerCenterX = headerRect.left + headerRect.width / 2;
        iconPosition = iconCenterX < headerCenterX ? 'left' : 'right';

        result.accordion.icon = {
          type: 'element',
          position: iconPosition,
          classes: iconEl.className || null,
          tag: iconEl.tagName.toLowerCase(),
          fontSize: iconS.fontSize,
          fontSizeRem: pxToRem(iconS.fontSize, rootFontSize),
          width: iconRect.width + 'px',
          widthRem: pxToRem(iconRect.width + 'px', rootFontSize),
          color: rgbToHex(iconS.color),
        };
      } else if (iconPseudo) {
        const iconFs = iconPseudo.getPropertyValue('font-size');
        result.accordion.icon = {
          type: 'pseudo',
          position: iconPosition,
          pseudoElement: hasBeforeIcon ? '::before' : '::after',
          content: iconPseudo.getPropertyValue('content'),
          fontFamily: iconPseudo.getPropertyValue('font-family'),
          fontSize: iconFs,
          fontSizeRem: pxToRem(iconFs, rootFontSize),
          width: iconPseudo.getPropertyValue('width'),
          widthRem: pxToRem(iconPseudo.getPropertyValue('width'), rootFontSize),
          color: rgbToHex(iconPseudo.getPropertyValue('color')),
          transform: iconPseudo.getPropertyValue('transform'),
          marginTop: iconPseudo.getPropertyValue('margin-top'),
        };
      }

      // --- Hover color from CSS rules ---
      try {
        const sheets = [...document.styleSheets];
        sheets.forEach(sheet => {
          try {
            [...sheet.cssRules].forEach(rule => {
              if (!rule.selectorText) return;
              const sel = rule.selectorText;
              const isAccordionBtn = sel.includes('accordion') || sel.includes('card-header') || sel.includes('panel-title') || sel.includes('collapse');
              if (!isAccordionBtn) return;

              if (sel.includes(':hover')) {
                if (rule.style.color) {
                  result.accordion.hoverColor = rule.style.color;
                }
                if (rule.style.backgroundColor) {
                  result.accordion.hoverBg = rule.style.backgroundColor;
                }
              }
            });
          } catch(e) { /* cross-origin */ }
        });
      } catch(e) {}
    }

    // --- Body / Content ---
    const bodySelectors = [
      '.accordion-body', '.accordion-collapse .card-body', '.card-body',
      '.panel-body', '.panel-collapse .panel-body',
      '.accordion-content', '.toggle-content',
    ];

    let firstBody = null;
    for (const sel of bodySelectors) {
      firstBody = accordionContainer.querySelector(sel);
      if (firstBody) break;
    }

    if (firstBody) {
      const bs = window.getComputedStyle(firstBody);
      result.accordion.body = {
        fontSize: bs.fontSize,
        fontSizeRem: pxToRem(bs.fontSize, rootFontSize),
        fontWeight: bs.fontWeight,
        color: rgbToHex(bs.color),
        backgroundColor: rgbToHex(bs.backgroundColor),
        padding: {
          top: bs.paddingTop,
          right: bs.paddingRight,
          bottom: bs.paddingBottom,
          left: bs.paddingLeft,
        },
        paddingRem: {
          top: pxToRem(bs.paddingTop, rootFontSize),
          right: pxToRem(bs.paddingRight, rootFontSize),
          bottom: pxToRem(bs.paddingBottom, rootFontSize),
          left: pxToRem(bs.paddingLeft, rootFontSize),
        },
      };
    }

    // --- Item / Card wrapper ---
    const itemSelectors = [
      '.accordion-item', '.accordion-wrapper .card', '.card',
      '.panel', '.accordion-group',
    ];

    let firstItem = null;
    for (const sel of itemSelectors) {
      firstItem = accordionContainer.querySelector(sel);
      if (firstItem) break;
    }

    if (firstItem) {
      const its = window.getComputedStyle(firstItem);
      const itemRect = firstItem.getBoundingClientRect();
      result.accordion.item = {
        backgroundColor: rgbToHex(its.backgroundColor),
        borderColor: rgbToHex(its.borderTopColor),
        borderWidth: its.borderTopWidth,
        borderStyle: its.borderTopStyle,
        borderRadius: its.borderRadius,
        borderRadiusRem: pxToRem(its.borderRadius, rootFontSize),
        boxShadow: its.boxShadow !== 'none' ? its.boxShadow : null,
        marginBottom: its.marginBottom,
        marginBottomRem: pxToRem(its.marginBottom, rootFontSize),
        height: Math.round(itemRect.height),
      };

      // Check if "plain" style (no background, no border, no shadow)
      const bgIsTransparent = !rgbToHex(its.backgroundColor) || rgbToHex(its.backgroundColor) === '#ffffff' || its.backgroundColor === 'rgba(0, 0, 0, 0)';
      const noBorder = its.borderTopWidth === '0px' || its.borderTopStyle === 'none';
      const noShadow = its.boxShadow === 'none';
      result.accordion.style = (bgIsTransparent && noBorder && noShadow) ? 'plain' : 'card';
    }

    // --- Variant detection ---
    result.accordion.variantsFound = allAccordions.length;
    result.accordion.containerClasses = accordionContainer.className;
  }

  return result;
})();
