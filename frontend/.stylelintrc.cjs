module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value', 'stylelint-use-logical'],
  rules: {
    'csstools/use-logical': 'always',
    'scale-unlimited/declaration-strict-value': [
      [
        '/color/',
        'background-color',
        'border-color',
        'fill',
        'stroke',
        'font-size',
        'line-height',
        'padding',
        'padding-inline',
        'padding-block',
        'margin',
        'margin-inline',
        'margin-block',
        'gap',
        'border-radius',
        'box-shadow',
        'transition-duration',
        'transition-timing-function',
        'animation-duration',
      ],
      {
        ignoreValues: [
          'inherit',
          'transparent',
          'currentcolor', // lowercase — `value-keyword-case` (stylelint-config-standard) requires lowercase keywords
          'none',
          '0',
          '-1px', // the standard visually-hidden/sr-only clip-and-shrink trick — not a spacing-scale value
          '0.01ms', // prefers-reduced-motion: "near-zero but non-zero" so transitionend/animationend still fire
          'auto',
          '50%',
          '100%',
          '1em',
          '1',
          'not-allowed',
          'pointer',
        ],
      },
    ],
    'color-no-hex': true,
    // CSS Modules classes are camelCase throughout this codebase (idiomatic
    // for `styles.pageTitle`-style JS property access) — kebab-case is a
    // different, unrelated convention `stylelint-config-standard` defaults
    // to enforcing; disabled rather than renaming every class in the app.
    'selector-class-pattern': null,
  },
  ignoreFiles: ['src/shared/theme/**', 'src/app/configuration/global.css'],
};
