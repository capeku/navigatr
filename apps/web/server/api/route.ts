export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({ statusCode: response.status, message: errorText })
  }

  return response.json()
})
