import express from 'express'
import axios from 'axios'

const app = express()
app.use(express.json())

// IMPORTANT:
// Do NOT change this fallback lightly.
// When running inside Docker, LAMBDA_CALLBACK_URL is provided via docker-compose (WSL2)
// and will always override this value.
// The correct Serverless Offline endpoint must use the httpPort (API Gateway),
// e.g. http://host.docker.internal:4000/callback
// The lambdaPort (3004) is internal and NOT reachable via HTTP.
// const LAMBDA_CALLBACK_URL = process.env.LAMBDA_CALLBACK_URL || 'http://host.docker.internal:4000/callback'
const LAMBDA_CALLBACK_URL = 'http://host.docker.internal:4000/callback'

// Helper function to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

app.post('/generate', async (req, res) => {
  try {
    const { prompt, generationId } = req.body

    console.log('Processing generation for prompt: ', prompt)

    // Add a 8-seconds delay before calling the callback
    await delay(8000) // FIXME: Change to be random between 4-8 seconds

    const images = [
     `https://fake-ai-images.com/${generationId}/image-1.png`,
     `https://fake-ai-images.com/${generationId}/image-2.png`,
    ]

    // Trigger Lambda callback
    try {
      await axios.post(LAMBDA_CALLBACK_URL, {
        prompt,
        generationId,
        images,
        timestamp: new Date().toISOString(),
      })
      console.log('Successfully triggered Lambda callback')
    } catch (callbackError) {
      console.error('Failed to trigger Lambda callback:', callbackError)
      throw callbackError
    }

    res.status(200).json({ generationId: generationId })
  } catch (error) {
    console.error('Error processing request:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    res.status(500).json({ error: 'Failed to process request' })
  }
})

export { app };

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Mock AI server running on port ${PORT}`);
  });
}
