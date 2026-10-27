import { useEffect } from "react";

/**
 * Full video player modal used from the Gallery grid.
 * Opens with native browser controls (play/pause, seek, volume,
 * fullscreen, picture-in-picture, playback speed) and starts playing
 * automatically. Escape key / overlay click / close button dismiss it.
 */
export default function VideoPlayerModal({ open, onClose, item, categoryName }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock page scroll behind the player
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div
      className="video-player-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="video-player-card" role="dialog" aria-modal="true">
        <div className="video-player-head">
          <div>
            <h3>{item.title}</h3>
            <span>
              {categoryName}
              {item.subcategory ? ` · ${item.subcategory}` : ""}
            </span>
          </div>
          <button
            type="button"
            className="modal-close video-player-close"
            onClick={onClose}
            aria-label="Close video player"
          >
            ×
          </button>
        </div>
        <div className="video-player-stage">
          {item.type === "video" ? (
            <video
              key={`${item.id}-${item.url}`}
              src={item.url}
              poster={item.thumbnailUrl || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={item.thumb || item.url} alt={item.title} />
          )}
        </div>
      </div>
    </div>
  );
}
