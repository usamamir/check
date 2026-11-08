import { useEffect, useState } from 'react'

type Props = {
  youtubeId: string
  title: string
  autoplay?: boolean
}

/**
 * Click-to-play YouTube embed.
 * Using youtube.com/embed after a user click avoids most “open on YouTube” / bot walls
 * and works in browser + Electron (when the app is served over http://127.0.0.1).
 */
export function VideoPlayer({ youtubeId, title, autoplay = false }: Props) {
  const [playing, setPlaying] = useState(autoplay)
  const thumb = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
  const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&fs=1`

  // Reset / autoplay whenever the chosen exercise video changes
  useEffect(() => {
    setPlaying(Boolean(autoplay))
  }, [youtubeId, autoplay])

  return (
    <div className="video-player">
      <div className="video-frame">
        {playing ? (
          <iframe
            key={youtubeId}
            title={title}
            src={src}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            className="video-poster"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <img src={thumb} alt="" />
            <span className="play-btn">▶ Play demo</span>
          </button>
        )}
      </div>
    </div>
  )
}
