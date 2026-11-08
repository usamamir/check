/**
 * Parse a YouTube URL into a video ID.
 * Supports watch?v=, youtu.be/, shorts/, embed/
 */
export function parseYouTubeVideoId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  // Bare 11-char id
  if (/^[\w-]{11}$/.test(raw)) return raw

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2]
        return id && /^[\w-]{11}$/.test(id) ? id : null
      }
      const v = url.searchParams.get('v')
      return v && /^[\w-]{11}$/.test(v) ? v : null
    }
  } catch {
    return null
  }

  return null
}

export function youtubeEmbedUrl(videoId: string, opts?: { start?: number; end?: number }): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1'
  })
  if (opts?.start != null) params.set('start', String(Math.floor(opts.start)))
  if (opts?.end != null) params.set('end', String(Math.floor(opts.end)))
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export function youtubeSearchUrl(exerciseName: string): string {
  const q = `${exerciseName} proper form`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

export type VideoMapEntry = {
  videoId: string
  start?: number
  end?: number
  channel?: string
}

export type VideoMap = Record<string, VideoMapEntry>
