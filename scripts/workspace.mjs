import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const mode = process.argv[2]

const tasks = {
  core: {
    name: '@navigatr/core',
    cwd: resolve(rootDir, 'packages/core'),
    args: ['node_modules/typescript/bin/tsc']
  },
  webEmbedCss: {
    name: '@navigatr/web:embed-css',
    cwd: resolve(rootDir, 'packages/web'),
    args: ['scripts/embed-css.mjs']
  },
  web: {
    name: '@navigatr/web',
    cwd: resolve(rootDir, 'packages/web'),
    args: ['node_modules/typescript/bin/tsc']
  },
  demoCleanup: {
    name: '@navigatr/demo:cleanup',
    cwd: resolve(rootDir, 'apps/web'),
    args: ['node_modules/nuxt/bin/nuxt.mjs', 'cleanup']
  },
  demo: {
    name: '@navigatr/demo',
    cwd: resolve(rootDir, 'apps/web'),
    args: ['node_modules/nuxt/bin/nuxt.mjs']
  }
}

const activeChildren = new Set()
let shuttingDown = false

function formatTaskLabel(taskName) {
  return `[${taskName}]`
}

function runTask(task, extraArgs = []) {
  return new Promise((resolveTask, rejectTask) => {
    console.log(`${formatTaskLabel(task.name)} starting`)

    const child = spawn(process.execPath, [...task.args, ...extraArgs], {
      cwd: task.cwd,
      env: process.env,
      stdio: 'inherit'
    })

    child.on('error', (error) => {
      rejectTask(error)
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolveTask()
        return
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`
      rejectTask(new Error(`${task.name} failed with ${reason}`))
    })
  })
}

function startPersistentTask(task, extraArgs = []) {
  console.log(`${formatTaskLabel(task.name)} watching`)

  const child = spawn(process.execPath, [...task.args, ...extraArgs], {
    cwd: task.cwd,
    env: process.env,
    stdio: 'inherit'
  })

  activeChildren.add(child)

  child.on('error', (error) => {
    if (!shuttingDown) {
      console.error(`${formatTaskLabel(task.name)} ${error.message}`)
      shutdown(1)
    }
  })

  child.on('exit', (code, signal) => {
    activeChildren.delete(child)

    if (shuttingDown) {
      return
    }

    const reason = signal ? `signal ${signal}` : `exit code ${code}`
    console.error(`${formatTaskLabel(task.name)} stopped with ${reason}`)
    shutdown(code ?? 1)
  })
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  for (const child of activeChildren) {
    child.kill('SIGINT')
  }

  const finalize = () => {
    process.exit(exitCode)
  }

  setTimeout(finalize, 250).unref()
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

async function runBuild() {
  await runTask(tasks.core)
  await runTask(tasks.webEmbedCss)
  await runTask(tasks.web)
  await runTask(tasks.demo, ['build'])
}

async function runDev() {
  // Build library outputs once so the demo can import fresh workspace packages.
  await runTask(tasks.core)
  await runTask(tasks.webEmbedCss)
  await runTask(tasks.web)
  await runTask(tasks.demoCleanup)

  startPersistentTask(tasks.core, ['--watch'])
  startPersistentTask(tasks.web, ['--watch'])
  startPersistentTask(tasks.demo, ['dev'])
}

async function main() {
  if (mode === 'build') {
    await runBuild()
    return
  }

  if (mode === 'dev') {
    await runDev()
    return
  }

  throw new Error(`Unknown mode "${mode}". Expected "dev" or "build".`)
}

main().catch((error) => {
  console.error(error.message)
  shutdown(1)
})
