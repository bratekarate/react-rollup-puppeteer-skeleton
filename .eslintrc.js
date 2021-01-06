module.exports = {
  root: true,
  //parser: "@babel/eslint-parser",
  parser: "esprima",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 6,
    ecmaFeatures: {
      modules: true,
      jsx: true
    }
  },
  env: {
    es6: true,
    node: true,
    browser: true
  },
  rules: {
    'prefer-const': 'warn'
  },
  extends: "eslint:recommended",
  overrides: [
    {
      files: [
        "*.ts",
        "*.tsx"
      ],
      plugins: [
        "@typescript-eslint/eslint-plugin",
        "react"
      ],
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended"
      ]
    },
  ]
}
