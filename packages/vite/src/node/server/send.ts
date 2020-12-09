import { IncomingMessage } from 'connect'
import { ServerResponse } from 'http'

export function send(
  req: IncomingMessage,
  res: ServerResponse,
  content: string | Buffer
) {}
