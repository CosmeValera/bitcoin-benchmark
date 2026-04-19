export default async function handler(req, res) {
  // Strip the /api/yahoo prefix to get the Yahoo Finance path
  const yahooPath = req.url.replace(/^\/api\/yahoo/, '')
  const url = `https://query1.finance.yahoo.com${yahooPath}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    const data = await response.text()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    res.status(response.status).send(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch from Yahoo Finance' })
  }
}
