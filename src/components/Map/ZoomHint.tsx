import './ZoomHint.css';

interface ZoomHintProps {
  zoom: number;
  totalBeaches: number;
  visibleBeaches: number;
}

export default function ZoomHint({ zoom, totalBeaches, visibleBeaches }: ZoomHintProps) {
  if (zoom >= 12) {
    // All beaches visible at this zoom level
    return null;
  }

  const hiddenBeaches = totalBeaches - visibleBeaches;

  return (
    <div className="zoom-hint">
      <div className="zoom-hint-icon">🔍</div>
      <div className="zoom-hint-content">
        <div className="zoom-hint-title">Zoom in for more beaches</div>
        <div className="zoom-hint-text">
          Showing {visibleBeaches} of {totalBeaches} beaches
          {hiddenBeaches > 0 && (
            <span className="zoom-hint-count"> ({hiddenBeaches} hidden)</span>
          )}
        </div>
      </div>
    </div>
  );
}
