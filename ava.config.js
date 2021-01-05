export default {
    files: ["./src/**/*.test.*"],
  // TODO: try using ts-node instead of babel
    babel: {
        "compileAsTests": ["src/**"],
        "testOptions": {
            presets: [
                "@babel/preset-react",
                "@babel/preset-typescript",
            ],
            plugins: [
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-transform-arrow-functions",
                "@babel/plugin-proposal-optional-chaining",
            ],
            "babelrc": false,
            "configFile": false
        },
        "extensions": [
            "ts",
            "tsx"
        ],
    },
};

