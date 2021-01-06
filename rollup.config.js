import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";
import {nodeResolve} from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import fs from "fs";
import path from "path";
import handler from 'serve-handler';
import http from 'http';
import {createHttpTerminator} from 'http-terminator';
import puppeteer from 'puppeteer';
import {spawn} from 'child_process';
import fp from 'find-free-port';

//const extensions = [".js", ".jsx", ".ts", ".tsx"];
const input = "src/app/index.tsx";

// TODO: Implement watching test files as well
//const watch = process.env.ROLLUP_WATCH === 'true';

let runningServer = null;

async function serveStart() {
  if (runningServer !== null) {
    return;
  }

  const server = http.createServer((request, response) => {
    return handler(request, response, {public: 'dist'});
  })

  const ports = await fp(8080);

  server.listen({port: ports[0]}, () => {
    console.log(`Running server at http://localhost:${ports[0]}`);
  });

  runningServer = {
    terminator: createHttpTerminator({
      server,
    }),
    port: ports[0]
  };

}

async function serveStop() {
  if (runningServer !== null) {
    console.log(`Terminating server at http://localhost:${runningServer.port}`);
    await runningServer.terminator.terminate();
    runningServer = null;
  }
}

let browser = null;
let wsEndpoint = null;
async function puppeteerLaunch() {
  console.log('Launching puppeteer.');
  browser = await puppeteer.launch({headless: false});
  wsEndpoint = browser.wsEndpoint();
  console.log('ws endpoint is ', wsEndpoint);
}

function puppeteerStop() {
  console.log('Stopping puppeteer.');
  if (browser === null) {
    return;
  }
  browser.close()
}

const servePlugin = {
  buildStart: async () => {
    await serveStart();
  }
}

const plugins = [
  typescript({
    typescript: require("typescript"),
  }),
  nodeResolve(),
  commonjs({
    include: [/node_modules/]
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('development')
  }),
  {
    writeBundle: () => {
      fs.copyFile(path.resolve("./src/index.html"), path.resolve("./dist/index.html"), err => console.error(err));
    }
  },
];

const external = [
  //...Object.keys(pkg.dependencies),
];

const testSetup = async () => {
  await serveStart();
  await puppeteerLaunch();
};
const testTeardown = async () => {
  await serveStop();
  puppeteerStop();
};

export default commandLineArgs => {
  if (commandLineArgs.configTest === true) {
    plugins.push({
      buildStart: async () => {
        console.log('Preparing tests');
        await testSetup();
      }
    });
    plugins.push({
      buildEnd: async () => {
        console.log('Running tests');
        const avaProc = spawn(`WS_ENDPOINT='${wsEndpoint}' SERVER_URL='http://localhost:${runningServer.port}' npx ava -v`, {
          shell: true,
          cwd: process.cwd(),
          stdio: 'inherit'
        });
        avaProc.on('exit', async () => {
          console.log('Teardown tests');
          await testTeardown();
        });
      }
    });
  }
  if (commandLineArgs.configServe === true) {
    plugins.push(servePlugin);
  }
  return [
    {
      input,
      output: {
        file: pkg.main,
        format: "esm",
        sourcemap: true,
      },
      external,
      plugins,
    },
  ]
}
