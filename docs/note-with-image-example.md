# Note with Image Attachment Example

This example demonstrates how to use the new `newNoteWithImage` feature to create and publish notes with image attachments.

## Basic Usage

```typescript
import { SubstackClient } from 'substack-api';
import { readFileSync } from 'fs';

const client = new SubstackClient({
  apiKey: 'your-api-key',
  hostname: 'your-publication.substack.com'
});

const ownProfile = await client.ownProfile();

// Read an image file and convert to base64
const imageBuffer = readFileSync('path/to/image.png');
const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

// Create a note with an image attachment
const response = await ownProfile
  .newNoteWithImage(base64Image)
  .paragraph()
  .text('Check out this ')
  .bold('amazing image')
  .text(' I want to share with you!')
  .paragraph()
  .text('The image has been automatically uploaded and attached to this note.')
  .publish();

console.log('Note published with ID:', response.id);
```

## How it Works

1. **Image Upload**: When you call `publish()` on a `NoteWithImageBuilder`, it first uploads the image by making a POST request to `/api/v1/image` with the base64-encoded image data.

2. **Attachment Creation**: After the image is uploaded successfully, it creates an attachment by making a POST request to `/api/v1/comment/attachment` with the uploaded image URL and type 'image'.

3. **Note Publishing**: Finally, it publishes the note with the attachment ID included in the `attachmentIds` array.

## API Calls Made

The above example makes three API calls:

1. **Upload Image**:
   ```
   POST /api/v1/image
   {
     "image": "data:image/png;base64,iVBORw0K..."
   }
   ```
   
   Response:
   ```json
   {
     "url": "https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png"
   }
   ```

2. **Create Attachment**:
   ```
   POST /api/v1/comment/attachment
   {
     "url": "https://substack-post-media.s3.amazonaws.com/public/images/5ddf2c83-5906-4c0a-9102-b408dbc74219_2560x1440.png",
     "type": "image"
   }
   ```
   
   Response:
   ```json
   {
     "id": "f9668d78-b07f-4697-b684-cdabae20dbc1",
     "type": "image",
     "publication": { ... },
     "post": { ... }
   }
   ```

3. **Publish Note**:
   ```
   POST /api/v1/comment/feed
   {
     "bodyJson": {
       "type": "doc",
       "attrs": { "schemaVersion": "v1" },
       "content": [...]
     },
     "attachmentIds": ["f9668d78-b07f-4697-b684-cdabae20dbc1"],
     "tabId": "for-you",
     "surface": "feed",
     "replyMinimumRole": "everyone"
   }
   ```

## Image Format Requirements

The image must be provided as a base64-encoded data URI with the format:

```
data:<mime-type>;base64,<base64-data>
```

Supported formats include:
- `data:image/png;base64,...`
- `data:image/jpeg;base64,...`
- `data:image/gif;base64,...`

## Error Handling

If any step fails (image upload, attachment creation, or note publishing), the entire operation will fail:

```typescript
try {
  const response = await ownProfile
    .newNoteWithImage(invalidImageData)
    .paragraph()
    .text('This will fail if image data is invalid')
    .publish();
} catch (error) {
  console.error('Failed to upload image, create attachment, or publish note:', error.message);
}
```

## Comparison with Other Note Types

Here's how the different note types compare:

```typescript
// Regular note (no attachment)
const regularNote = await ownProfile
  .newNote()
  .paragraph()
  .text('This is a regular note without attachments')
  .publish();

// Note with link attachment  
const noteWithLink = await ownProfile
  .newNoteWithLink('https://example.com')
  .paragraph()
  .text('This note will have a link attachment')
  .publish();

// Note with image attachment
const noteWithImage = await ownProfile
  .newNoteWithImage('data:image/png;base64,...')
  .paragraph()
  .text('This note will have an image attachment')
  .publish();
```

The `NoteWithImageBuilder` supports all the same formatting options as the regular `NoteBuilder` (bold, italic, links, lists, etc.), but automatically handles the image upload and attachment creation process.

## Advanced Example with Complex Formatting

```typescript
import { readFileSync } from 'fs';

const imageBuffer = readFileSync('screenshot.png');
const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

const response = await ownProfile
  .newNoteWithImage(base64Image)
  .paragraph()
  .text('🎯 ')
  .bold('New Feature Release')
  .paragraph()
  .text('We\'ve just launched our latest feature! Key highlights include:')
  .bulletList()
  .item()
  .bold('Performance')
  .text(' - 50% faster load times')
  .item()
  .italic('User Interface')
  .text(' - Fresh new design')
  .item()
  .text('Enhanced ')
  .code('API capabilities')
  .finish()
  .paragraph()
  .text('Check out the screenshot above for a preview! For more details, visit our ')
  .link('documentation', 'https://docs.example.com')
  .text('.')
  .publish();

console.log('Note with image and complex formatting published!');
```
