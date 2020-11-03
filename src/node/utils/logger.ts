import { Ora } from 'ora'
import chalk from 'chalk'

export interface LoggerOptions {
  /**
   * Suppress all logs.
   * @default false
   */
  silent?: boolean
  /**
   * Control how logs are handled.
   * @default console.log
   */
  print?: (text: string) => void
  /**
   * Control how warnings are handled.
   * @default console.warn
   */
  warn?: (text: string) => void
}

export interface Logger {
  (text: string): void
  /** Log with a [warn] prefix. */
  warn(text: string): void
  /** Start an `ora` spinner. */
  start(text: string): Logger.Task
  /** @internal Destroy all `ora` spinners. */
  halt(): void
}

export namespace Logger {
  // Tasks wrap an `ora` spinner with a simpler interface,
  // so the "silent" option takes less code to implement.
  export interface Task {
    update(text: string): void
    done(text?: string): void
    fail(text?: string): void
  }
}

interface Task extends Logger.Task {
  spinner: Ora
}

export function createLogger({
  silent,
  print = console.log,
  warn = console.warn
}: LoggerOptions = {}): Logger {
  if (silent) {
    return createSilentLogger()
  }

  // Hide task spinners when debugging or testing.
  const showTasks = !process.env.DEBUG && process.env.NODE_ENV !== 'test'

  // Only the last task is visible.
  const tasks: Task[] = []

  const getTask = () => tasks[tasks.length - 1]
  const showTask = () => showTasks && getTask() && getTask().spinner.start()
  const hideTask = () => showTasks && getTask() && getTask().spinner.stop()

  function log(text: string) {
    hideTask()
    print(text)
    showTask()
  }

  log.warn = (text: string) => {
    hideTask()
    warn(chalk.yellow('[warn] ') + text)
    showTask()
  }

  log.start = (text: string) => {
    const spinner: Ora = require('ora')(text)
    if (!showTasks) {
      spinner.render()
    }
    const task: Task = {
      spinner,
      update(text) {
        spinner.text = text
        if (!showTasks) {
          spinner.render()
        }
      },
      done(text) {
        const index = tasks.indexOf(task)
        if (index >= 0) {
          hideTask()
          if (text) spinner.succeed(text)
          else spinner.stop()
          tasks.splice(index, 1)
          showTask()
        }
      },
      fail(text) {
        const index = tasks.indexOf(task)
        if (index >= 0) {
          hideTask()
          spinner.fail(text)
          tasks.splice(index, 1)
          showTask()
        }
      }
    }
    hideTask()
    tasks.push(task)
    showTask()
    return task
  }

  log.halt = () => {
    hideTask()
    tasks.length = 0
  }

  return log
}

function createSilentLogger(): Logger {
  function log() {}
  log.warn = log.halt = log
  log.start = () => ({
    update: log,
    done: log,
    fail: log
  })
  return log
}
