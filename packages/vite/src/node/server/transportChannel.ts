export interface TransportChannelClient {
  send(payload: any): void
}

export interface TransportChannel {
  send(payload: any): void
  onMessage(listener: (payload: any) => void): void
  offMessage(listener: (payload: any) => void): void
  listen(): void
  close(): Promise<void> | void
}
