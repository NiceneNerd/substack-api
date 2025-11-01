import { NoteWithImageBuilder } from '../../src/domain/note-builder'
import { HttpClient } from '../../src/internal/http-client'

// Mock HttpClient
jest.mock('../../src/internal/http-client')
const MockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>

describe('NoteWithImageBuilder', () => {
  let mockClient: jest.Mocked<HttpClient>
  let builder: NoteWithImageBuilder
  const testImageData =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  beforeEach(() => {
    mockClient = new MockHttpClient('https://example.com', {
      hostname: 'example.com',
      apiKey: 'test-api-key'
    }) as jest.Mocked<HttpClient>
    builder = new NoteWithImageBuilder(mockClient, testImageData)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('publish', () => {
    it('should upload image, create attachment, and publish note with attachment ID', async () => {
      // Mock image upload response
      const mockImageUploadResponse = {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png'
      }

      // Mock attachment creation response
      const mockAttachmentResponse = {
        id: '19b5d6f9-46db-47d6-b381-17cb5f443c00',
        type: 'image',
        publication: {},
        post: {}
      }

      // Mock note publish response
      const mockPublishResponse = {
        user_id: 12345,
        body: 'Test note',
        body_json: {
          type: 'doc',
          attrs: { schemaVersion: 'v1' },
          content: []
        },
        post_id: null,
        publication_id: null,
        media_clip_id: null,
        ancestor_path: '',
        type: 'feed',
        status: 'published',
        reply_minimum_role: 'everyone',
        id: 67890,
        deleted: false,
        date: '2025-08-06T12:00:00Z',
        name: 'Test User',
        photo_url: 'https://example.com/photo.jpg',
        reactions: {},
        children: [],
        user_bestseller_tier: null,
        isFirstFeedCommentByUser: false,
        reaction_count: 0,
        restacks: 0,
        restacked: false,
        children_count: 0,
        attachments: []
      }

      mockClient.post
        .mockResolvedValueOnce(mockImageUploadResponse) // First call for image upload
        .mockResolvedValueOnce(mockAttachmentResponse) // Second call for attachment
        .mockResolvedValueOnce(mockPublishResponse) // Third call for note publish

      // Build and publish a simple note
      const result = await builder.paragraph().text('Check out this image!').publish()

      // Verify three calls were made in the correct order
      expect(mockClient.post).toHaveBeenCalledTimes(3)

      // Verify first call was image upload
      expect(mockClient.post).toHaveBeenNthCalledWith(1, '/api/v1/image', {
        image: testImageData
      })

      // Verify second call was attachment creation
      expect(mockClient.post).toHaveBeenNthCalledWith(2, '/api/v1/comment/attachment', {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png',
        type: 'image'
      })

      // Verify third call was note publish with attachment ID
      expect(mockClient.post).toHaveBeenNthCalledWith(
        3,
        '/api/v1/comment/feed',
        expect.objectContaining({
          attachmentIds: ['19b5d6f9-46db-47d6-b381-17cb5f443c00'],
          bodyJson: {
            type: 'doc',
            attrs: { schemaVersion: 'v1' },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Check out this image!'
                  }
                ]
              }
            ]
          },
          tabId: 'for-you',
          surface: 'feed',
          replyMinimumRole: 'everyone'
        })
      )

      expect(result).toEqual(mockPublishResponse)
    })

    it('should handle complex note content with image attachments', async () => {
      // Mock image upload response
      const mockImageUploadResponse = {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/test-image.jpg'
      }

      // Mock attachment creation response
      const mockAttachmentResponse = {
        id: 'attachment-id-123',
        type: 'image',
        publication: {},
        post: {}
      }

      // Mock note publish response
      const mockPublishResponse = {
        user_id: 12345,
        body: 'Complex note',
        body_json: {
          type: 'doc',
          attrs: { schemaVersion: 'v1' },
          content: []
        },
        post_id: null,
        publication_id: null,
        media_clip_id: null,
        ancestor_path: '',
        type: 'feed',
        status: 'published',
        reply_minimum_role: 'everyone',
        id: 67890,
        deleted: false,
        date: '2025-08-06T12:00:00Z',
        name: 'Test User',
        photo_url: 'https://example.com/photo.jpg',
        reactions: {},
        children: [],
        user_bestseller_tier: null,
        isFirstFeedCommentByUser: false,
        reaction_count: 0,
        restacks: 0,
        restacked: false,
        children_count: 0,
        attachments: []
      }

      mockClient.post
        .mockResolvedValueOnce(mockImageUploadResponse)
        .mockResolvedValueOnce(mockAttachmentResponse)
        .mockResolvedValueOnce(mockPublishResponse)

      // Build a complex note with multiple formatting options
      const result = await builder
        .paragraph()
        .text('This is ')
        .bold('bold text')
        .text(' and ')
        .italic('italic text')
        .text('.')
        .paragraph()
        .text('Here is a ')
        .link('link', 'https://example.com')
        .text(' in the note.')
        .publish()

      // Verify three calls were made in the correct order
      expect(mockClient.post).toHaveBeenCalledTimes(3)

      // Verify first call was image upload
      expect(mockClient.post).toHaveBeenNthCalledWith(1, '/api/v1/image', {
        image: testImageData
      })

      // Verify second call was attachment creation
      expect(mockClient.post).toHaveBeenNthCalledWith(2, '/api/v1/comment/attachment', {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/test-image.jpg',
        type: 'image'
      })

      // Verify the complex structure was preserved in the note publish
      expect(mockClient.post).toHaveBeenNthCalledWith(
        3,
        '/api/v1/comment/feed',
        expect.objectContaining({
          attachmentIds: ['attachment-id-123'],
          bodyJson: {
            type: 'doc',
            attrs: { schemaVersion: 'v1' },
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'This is ' },
                  { type: 'text', text: 'bold text', marks: [{ type: 'bold' }] },
                  { type: 'text', text: ' and ' },
                  { type: 'text', text: 'italic text', marks: [{ type: 'italic' }] },
                  { type: 'text', text: '.' }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Here is a ' },
                  {
                    type: 'text',
                    text: 'link',
                    marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
                  },
                  { type: 'text', text: ' in the note.' }
                ]
              }
            ]
          }
        })
      )

      expect(result).toEqual(mockPublishResponse)
    })

    it('should handle image upload failure', async () => {
      // Mock image upload to fail
      mockClient.post.mockRejectedValueOnce(new Error('Image upload failed'))

      // Attempt to publish should throw the error
      await expect(builder.paragraph().text('Test').publish()).rejects.toThrow(
        'Image upload failed'
      )

      // Verify only the image upload call was made
      expect(mockClient.post).toHaveBeenCalledTimes(1)
      expect(mockClient.post).toHaveBeenNthCalledWith(1, '/api/v1/image', {
        image: testImageData
      })
    })

    it('should handle attachment creation failure', async () => {
      // Mock image upload response
      const mockImageUploadResponse = {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/test-image.jpg'
      }

      mockClient.post
        .mockResolvedValueOnce(mockImageUploadResponse) // Image upload succeeds
        .mockRejectedValueOnce(new Error('Attachment creation failed')) // Attachment fails

      // Attempt to publish should throw the error
      await expect(builder.paragraph().text('Test').publish()).rejects.toThrow(
        'Attachment creation failed'
      )

      // Verify two calls were made
      expect(mockClient.post).toHaveBeenCalledTimes(2)
      expect(mockClient.post).toHaveBeenNthCalledWith(1, '/api/v1/image', {
        image: testImageData
      })
      expect(mockClient.post).toHaveBeenNthCalledWith(2, '/api/v1/comment/attachment', {
        url: 'https://substack-post-media.s3.amazonaws.com/public/images/test-image.jpg',
        type: 'image'
      })
    })
  })
})
