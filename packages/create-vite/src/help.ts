const helpMessage = `Usage: create-vite [OPTION]... [DIRECTORY]
Create a new Vite project in JavaScript or TypeScript.

With no arguments, start an interactive command line dialog.

Options:
  -t, --template NAME        use this template

Available templates:`
export function getUsageInfo(formattedFrameworkNames: string[]): string {
  return `${helpMessage}
${formattedFrameworkNames.join('\n')}`
}
