import { SubstackClient } from '../../src/substack-client'

describe('note with image attachment integration tests', () => {
  let client: SubstackClient

  beforeEach(() => {
    // Clear captured requests before each test
    global.INTEGRATION_SERVER.capturedRequests.length = 0

    // Create client configured to use our local test server
    const url = new URL(global.INTEGRATION_SERVER.url)
    const hostname = `${url.hostname}:${url.port}`

    client = new SubstackClient({
      hostname: hostname,
      apiKey: 'test-key',
      protocol: 'http' // Use HTTP for local test server
    })
  })

  test('should upload image, create attachment, and publish note with correct request structure', async () => {
    const profile = await client.ownProfile()
    const testImageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    await profile
      .newNoteWithImage(testImageData)
      .paragraph()
      .text('Check out this ')
      .bold('amazing image')
      .text('!')
      .publish()

    // Should have made 3 requests: image upload + attachment creation + note publishing
    expect(global.INTEGRATION_SERVER.capturedRequests).toHaveLength(3)

    // Verify first request was image upload
    const imageUploadRequest = global.INTEGRATION_SERVER.capturedRequests[0]
    expect(imageUploadRequest.method).toBe('POST')
    expect(imageUploadRequest.url).toBe('/api/v1/image')
    expect(imageUploadRequest.body).toHaveProperty('image')
    expect((imageUploadRequest.body as any).image).toBe(testImageData)

    // Verify second request was attachment creation
    const attachmentRequest = global.INTEGRATION_SERVER.capturedRequests[1]
    expect(attachmentRequest.method).toBe('POST')
    expect(attachmentRequest.url).toBe('/api/v1/comment/attachment')
    expect(attachmentRequest.body).toMatchObject({
      url: 'https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png',
      type: 'image'
    })

    // Verify third request was note publishing with attachment
    const noteRequest = global.INTEGRATION_SERVER.capturedRequests[2]
    expect(noteRequest.method).toBe('POST')
    expect(noteRequest.url).toBe('/api/v1/comment/feed')

    const capturedNoteBody = noteRequest.body as any

    // Verify the structure matches our expected format
    expect(capturedNoteBody).toMatchObject({
      bodyJson: {
        type: 'doc',
        attrs: { schemaVersion: 'v1' },
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Check out this ' },
              { type: 'text', text: 'amazing image', marks: [{ type: 'bold' }] },
              { type: 'text', text: '!' }
            ]
          }
        ]
      },
      attachmentIds: ['19b5d6f9-46db-47d6-b381-17cb5f443c00'],
      replyMinimumRole: 'everyone',
      tabId: 'for-you',
      surface: 'feed'
    })
  })

  test('should build complex note with image attachment and correct structure', async () => {
    const profile = await client.ownProfile()
    const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

    await profile
      .newNoteWithImage(testImageData)
      .paragraph()
      .text('This is a ')
      .bold('complex note')
      .text(' with an image.')
      .paragraph()
      .text('It includes ')
      .italic('formatting')
      .text(' and ')
      .code('code snippets')
      .text('.')
      .publish()

    expect(global.INTEGRATION_SERVER.capturedRequests).toHaveLength(3)

    const imageUploadRequest = global.INTEGRATION_SERVER.capturedRequests[0]
    expect(imageUploadRequest.body).toEqual({
      image: testImageData
    })

    const attachmentRequest = global.INTEGRATION_SERVER.capturedRequests[1]
    expect(attachmentRequest.body).toEqual({
      url: 'https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png',
      type: 'image'
    })

    const noteRequest = global.INTEGRATION_SERVER.capturedRequests[2]
    const noteBody = noteRequest.body as any

    // Verify the complex structure was built correctly
    expect(noteBody.bodyJson.content).toHaveLength(2) // Two paragraphs

    // First paragraph
    expect(noteBody.bodyJson.content[0].content).toEqual([
      { type: 'text', text: 'This is a ' },
      { type: 'text', text: 'complex note', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' with an image.' }
    ])

    // Second paragraph
    expect(noteBody.bodyJson.content[1].content).toEqual([
      { type: 'text', text: 'It includes ' },
      { type: 'text', text: 'formatting', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' and ' },
      { type: 'text', text: 'code snippets', marks: [{ type: 'code' }] },
      { type: 'text', text: '.' }
    ])

    // Verify attachment ID is included
    expect(noteBody.attachmentIds).toEqual(['19b5d6f9-46db-47d6-b381-17cb5f443c00'])
  })

  test('should handle different image formats correctly', async () => {
    const profile = await client.ownProfile()
    const imageFormats = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQA//Z',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    ]

    for (const imageData of imageFormats) {
      // Clear previous requests
      global.INTEGRATION_SERVER.capturedRequests.length = 0

      await profile
        .newNoteWithImage(imageData)
        .paragraph()
        .text('Testing with image format')
        .publish()

      expect(global.INTEGRATION_SERVER.capturedRequests).toHaveLength(3)

      const imageUploadRequest = global.INTEGRATION_SERVER.capturedRequests[0]
      expect(imageUploadRequest.body).toEqual({
        image: imageData
      })
    }
  })

  test('should work with lists and complex formatting', async () => {
    const profile = await client.ownProfile()
    const testImageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    await profile
      .newNoteWithImage(testImageData)
      .paragraph()
      .text('Here are some key points about this image:')
      .bulletList()
      .item()
      .text('First ')
      .bold('important')
      .text(' point')
      .item()
      .text('Second point with ')
      .link('a link', 'https://reference.com')
      .item()
      .code('Third point')
      .text(' with code')
      .finish()
      .publish()

    expect(global.INTEGRATION_SERVER.capturedRequests).toHaveLength(3)

    const noteRequest = global.INTEGRATION_SERVER.capturedRequests[2]
    const noteBody = noteRequest.body as any

    // Should have paragraph + bullet list
    expect(noteBody.bodyJson.content).toHaveLength(2)
    expect(noteBody.bodyJson.content[0].type).toBe('paragraph')
    expect(noteBody.bodyJson.content[1].type).toBe('bulletList')

    // Verify bullet list structure
    const bulletList = noteBody.bodyJson.content[1]
    expect(bulletList.content).toHaveLength(3) // Three list items

    // Verify attachment is included
    expect(noteBody.attachmentIds).toEqual(['19b5d6f9-46db-47d6-b381-17cb5f443c00'])
  })
})
