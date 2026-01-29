import { MANAGEMENT_COLORS } from '../../utils/mapConfig';
import './Legend.css';

export default function Legend() {
  const managementItems = [
    { type: 'state', label: 'State Managed' },
    { type: 'county', label: 'County Managed' },
    { type: 'city', label: 'City Managed' },
    { type: 'federal', label: 'Federal Managed' },
    { type: 'special-district', label: 'Special District' },
  ] as const;

  const dataStatusItems = [
    { status: 'complete', label: 'Fully Researched', symbol: '✓' },
    { status: 'partial', label: 'Partial Data', symbol: '○' },
    { status: 'api-only', label: 'Limited Data', symbol: '·' },
  ] as const;

  return (
    <div className="map-legend">
      <div className="legend-section">
        <h4 className="legend-title">Beach Management</h4>
        <div className="legend-items">
          {managementItems.map(({ type, label }) => (
            <div key={type} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: MANAGEMENT_COLORS[type] }}
              />
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="legend-section">
        <h4 className="legend-title">Data Completeness</h4>
        <div className="legend-items">
          {dataStatusItems.map(({ status, label, symbol }) => (
            <div key={status} className="legend-item">
              <div className={`legend-status-icon ${status}`}>{symbol}</div>
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
