import type { BeachProperties } from '../../types/beach.types';
import './BeachPopup.css';

interface BeachPopupProps {
  beach: BeachProperties;
}

export default function BeachPopup({ beach }: BeachPopupProps) {
  const {
    name,
    accountableEntity,
    managingEntity,
    contractedManager,
    lifeguardService,
    managerContact,
    county,
    managementType,
    dataStatus,
    accessibility,
  } = beach;

  const isComplete = dataStatus === 'complete';
  const isPartial = dataStatus === 'partial';
  const isApiOnly = dataStatus === 'api-only';

  return (
    <div className="beach-popup">
      <div className="beach-popup-header">
        <h3 className="beach-popup-title">{name}</h3>
        {dataStatus && (
          <span className={`data-status-badge ${dataStatus}`}>
            {isComplete && '✓ Fully Researched'}
            {isPartial && 'Partial Data'}
            {isApiOnly && 'Limited Data'}
          </span>
        )}
      </div>

      {accountableEntity && managingEntity ? (
        <>
          <div className="beach-popup-section accountability-section">
            <strong>Technical/Legal Responsibility:</strong>
            <div className="beach-popup-value accountability-value">
              {accountableEntity}
              {managementType && <span className="beach-popup-badge">{managementType}</span>}
            </div>
          </div>

          <div className="beach-popup-section">
            <strong>Primary Manager:</strong>
            <div className="beach-popup-value">{managingEntity}</div>
            {managerContact?.department && (
              <div className="beach-popup-subvalue">Department: {managerContact.department}</div>
            )}
          </div>

          {contractedManager && (
            <div className="beach-popup-section">
              <strong>Contracted Municipality/Operations:</strong>
              <div className="beach-popup-value">{contractedManager}</div>
            </div>
          )}

          {lifeguardService && (
            <div className="beach-popup-section">
              <strong>Lifeguard Provider:</strong>
              <div className="beach-popup-value">{lifeguardService}</div>
            </div>
          )}
        </>
      ) : (
        <div className="beach-popup-section incomplete-notice">
          <em>Management information not yet researched. Check back for updates.</em>
        </div>
      )}

      <div className="beach-popup-section">
        <strong>Location:</strong>
        <div className="beach-popup-value">{county} County</div>
      </div>

      {accessibility && (Object.values(accessibility).some(Boolean)) && (
        <div className="beach-popup-section">
          <strong>Accessibility:</strong>
          <div className="beach-popup-value">
            {accessibility.wheelchairAccessible && '♿ Wheelchair Accessible'}
            {accessibility.dogFriendly && ' 🐕 Dog Friendly'}
            {accessibility.parkingAvailable && ' 🅿️ Parking Available'}
          </div>
        </div>
      )}

      {managerContact && (managerContact.phone || managerContact.email || managerContact.website) && (
        <div className="beach-popup-section">
          <strong>Contact Information:</strong>
          <div className="beach-popup-contacts">
            {managerContact?.phone && (
              <div>
                <span className="contact-label">Phone:</span>{' '}
                <a href={`tel:${managerContact.phone}`}>{managerContact.phone}</a>
              </div>
            )}
            {managerContact?.email && (
              <div>
                <span className="contact-label">Email:</span>{' '}
                <a href={`mailto:${managerContact.email}`}>{managerContact.email}</a>
              </div>
            )}
            {managerContact?.website && (
              <div>
                <span className="contact-label">Website:</span>{' '}
                <a href={managerContact.website} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {managerContact?.address && (
        <div className="beach-popup-section">
          <strong>Address:</strong>
          <div className="beach-popup-value">{managerContact.address}</div>
        </div>
      )}

      {beach.facilities && beach.facilities.length > 0 && (
        <div className="beach-popup-section">
          <strong>Facilities:</strong>
          <div className="beach-popup-value">{beach.facilities.join(', ')}</div>
        </div>
      )}

      {beach.notes && (
        <div className="beach-popup-section">
          <strong>Notes:</strong>
          <div className="beach-popup-value">{beach.notes}</div>
        </div>
      )}
    </div>
  );
}
