import { describe, expect, it } from 'vitest'
import { parseYouTubeVideoId, youtubeEmbedUrl, youtubeSearchUrl } from './youtube'

describe('parseYouTubeVideoId', () => {
  it('parses watch URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('parses youtu.be', () => {
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('parses shorts and embed', () => {
    expect(parseYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('accepts bare ids', () => {
    expect(parseYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('rejects garbage', () => {
    expect(parseYouTubeVideoId('not-a-url')).toBeNull()
  })
})

describe('youtube helpers', () => {
  it('builds nocookie embed with params', () => {
    const url = youtubeEmbedUrl('dQw4w9WgXcQ', { start: 10, end: 40 })
    expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(url).toContain('rel=0')
    expect(url).toContain('start=10')
    expect(url).toContain('end=40')
  })
  it('builds search URL', () => {
    expect(youtubeSearchUrl('Bench Press')).toContain('proper%20form')
  })
})
