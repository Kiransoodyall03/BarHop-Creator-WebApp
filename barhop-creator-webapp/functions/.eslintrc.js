module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    // refreshDistrictVenues.js uses nullish coalescing (??) and optional
    // chaining (?.) — both ES2020. Node 24 runs them natively; the parser
    // just has to accept the syntax.
    "ecmaVersion": 2022,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
