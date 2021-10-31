#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

import os from 'os'
import { join } from 'path'
import https from 'https'
import SSE from 'sse'
import keys from 'live-server-https'
import open from 'open'
import extatic from 'extatic'
import runningAt from 'running-at'
import qrcode from 'qrcode-terminal'
import chokidar from 'chokidar'
import chalk from 'chalk'
import dotenv from 'read-dotenv'

if (process.argv.find(arg => ['--version', '-v'].includes(arg))) {
  console.log((await import('../package')).version)
  process.exit(0)
}

if (process.argv.find(arg => ['help', '--help', '-h'].includes(arg))) {
  console.log(`
${chalk.bold('Usage:')}
  just-serve [path]

${chalk.bold('Examples:')}
  ${chalk.grey('# serves cwd')}
  just-serve

  ${chalk.grey('# serve a given path')}
  just-serve my/path

  ${chalk.grey('# serve with given host/port')}
  HOST=localhost PORT=7777 just-serve

${chalk.grey.bold(`Add this to enable`)} ${chalk.bold(
    'live-reload'
  )} ${chalk.grey.bold(`for when files change:`)}
  <body>
    <script src="reload.js"></script>
  </body>
`)
  process.exit(0)
}

const root = join(process.cwd(), process.argv[2] ?? '')

const env = dotenv(
  {
    PORT: 3000,
    HOST: '0.0.0.0'
  },
  root
)

const serveHandler = extatic({
  root,
  cors: true,
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  },
  showDir: true,
  showDotfiles: false,
  autoIndex: true
})

const print = (s: string) =>
  console.log(`${new Date().toLocaleTimeString()} ${s}`)

const server = https.createServer(keys, (req, res) => {
  print(
    `${req.method === 'GET' ? chalk.grey(req.method) : req.method} ${req.url}`
  )

  if (req.url)
    if (req.url.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm')
    } else if (req.url.endsWith('/reload.js')) {
      return res.end(`
        es = new EventSource('/onchange');
        es.onopen = () => console.warn('live-reload started')
        es.onmessage = () => es.onmessage = () => location = location;
      `)
    }

  serveHandler(req, res)
})

let clients: any[] = []
server.listen(env.PORT, env.HOST, () => {
  const sse = new SSE(server, { path: '/onchange' })
  sse.on('connection', (client: any) => {
    clearTimeout(openTimeout)
    clients.push(client)
    client.send('change')
    print('SSE /onchange')
  })

  const fileWatcher = chokidar.watch([join(root, '**/*')], {
    awaitWriteFinish: {
      stabilityThreshold: 40,
      pollInterval: 10
    }
  })
  fileWatcher.on('change', () => {
    clients = clients.filter(client => {
      try {
        client.send('change')
        return true
      } catch {
        return false
      }
    })
  })

  const addr = `https://${runningAt().ip}:${env.PORT}/`
  console.log({ ...env, root: root.replace(os.homedir(), '~'), addr })
  qrcode.generate(addr, { small: true })
  const openTimeout = setTimeout(() => open(addr), 3000)
  console.log('  -=- server is ready -=-\n')
})
