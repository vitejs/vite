export default async function handleRequest(request) {
  return new Response(`hello from ${request.url}`)
}

export async function custom(request) {
  return new Response(`custom handler: ${request.url}`)
}
