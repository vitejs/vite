export enum Status {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export const statusMessage = (status: Status) => {
  switch (status) {
    case Status.GREEN:
      return 'All good'
    case Status.YELLOW:
      return 'Warning'
    case Status.RED:
      return 'Error'
  }
}
