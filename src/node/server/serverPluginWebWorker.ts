import { ServerPlugin } from '.'

export const webWrokerPlugin: ServerPlugin = ({ app }) => {
  app.use(async (ctx, next) => {})
}
