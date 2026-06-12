export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { apiKey, ...body } = req.body;

    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Always use non-streaming to avoid ReadableStream issues
    const requestBody = Object.assign({}, body, { stream: false });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify(requestBody)
    });

    // Read the full response as text first, then parse
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from Anthropic: ' + text.substring(0, 200) });
    }

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
