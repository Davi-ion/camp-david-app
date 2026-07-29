import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { GROUPS } from '../data/campers';
import { IconX, IconPlus, IconSearch, IconCheck, IconAlertTriangle, IconShieldCheck, IconUserCheck, IconTrash } from '@tabler/icons-react';

const INCIDENT_TYPES = [
  { id: 'medical', label: 'Medical', emoji: '⚕️', color: '#EF4444' },
  { id: 'behavioural', label: 'Behavioural', emoji: '⚠️', color: '#F59E0B' },
  { id: 'welfare', label: 'Welfare', emoji: '🛡️', color: '#3B82F6' },
  { id: 'safety', label: 'Safety', emoji: '🦺', color: '#10B981' },
  { id: 'other', label: 'Other / General', emoji: '📝', color: '#8B5CF6' },
];

const SEVERITIES = [
  { id: 'low', label: 'Low', color: '#10B981' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'critical', label: 'Critical', color: '#7C3AED' },
];

export default function ReportIncidentModal() {
  const { state, dispatch } = useApp();
  const { hasPermission, isAdmin } = usePermissions();
  const user = state.currentUser;

  const isOpen = state.isIncidentModalOpen;

  const [selectedCamperIds, setSelectedCamperIds] = useState([]);
  const [camperSearch, setCamperSearch] = useState('');
  const [formType, setFormType] = useState('medical');
  const [severity, setSeverity] = useState('low');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedCamperIds([]);
      setCamperSearch('');
      setFormType('medical');
      setSeverity('low');
      setTitle('');
      setLocation('');
      setFormDesc('');
      setIsSubmitting(false);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Selectable campers
  const selectableCampers = useMemo(() => {
    const list = state.campers || [];
    if (isAdmin || hasPermission('view:campers')) return list;
    return list.filter((c) => c.group === user?.group || c.platoonId === user?.platoonId);
  }, [state.campers, user, isAdmin, hasPermission]);

  // Filtered campers for search
  const filteredCampers = useMemo(() => {
    const q = camperSearch.trim().toLowerCase();
    if (!q) return selectableCampers;
    return selectableCampers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.registrationNumber && c.registrationNumber.toLowerCase().includes(q))
    );
  }, [selectableCampers, camperSearch]);

  if (!isOpen) return null;

  const toggleCamperSelection = (id) => {
    setSelectedCamperIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCampers.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selectedCamperIds.includes(id));

    if (allSelected) {
      // Unselect all filtered
      setSelectedCamperIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedCamperIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelected = () => {
    setSelectedCamperIds([]);
  };

  const onClose = () => {
    dispatch({ type: 'CLOSE_INCIDENT_MODAL' });
  };

  const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formDesc.trim()) {
      alert('Please enter a description for the incident.');
      return;
    }

    setIsSubmitting(true);

    const typeObj = INCIDENT_TYPES.find((t) => t.id === formType);
    const incidentTitle = title.trim() || `${(typeObj?.label || 'General').toUpperCase()} Incident`;

    const payload = {
      title: incidentTitle,
      description: formDesc.trim(),
      category: formType || 'other',
      severity: severity || 'low',
      location: location.trim() || null,
      camperIds: selectedCamperIds.length > 0 ? selectedCamperIds : [],
    };

    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedData = await res.json();
        dispatch({ type: 'ADD_INCIDENT', payload: savedData });
      } else {
        // Fallback local dispatch if API response is not 200/201
        const fallbackIncidents = selectedCamperIds.length > 0
          ? selectedCamperIds.map((cId) => ({
              id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title: incidentTitle,
              description: formDesc.trim(),
              category: formType || 'other',
              severity: severity || 'low',
              camperId: cId,
              camper: state.campers.find((c) => c.id === cId),
              reportedAt: new Date().toISOString(),
              status: 'open',
              reportedBy: user?.id,
            }))
          : [{
              id: `inc-${Date.now()}`,
              title: incidentTitle,
              description: formDesc.trim(),
              category: formType || 'other',
              severity: severity || 'low',
              camperId: null,
              reportedAt: new Date().toISOString(),
              status: 'open',
              reportedBy: user?.id,
            }];
        dispatch({ type: 'ADD_INCIDENT', payload: fallbackIncidents });
      }
    } catch (err) {
      console.error('API incident post error, using local fallback:', err);
      const fallbackIncidents = selectedCamperIds.length > 0
        ? selectedCamperIds.map((cId) => ({
            id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: incidentTitle,
            description: formDesc.trim(),
            category: formType || 'other',
            severity: severity || 'low',
            camperId: cId,
            camper: state.campers.find((c) => c.id === cId),
            reportedAt: new Date().toISOString(),
            status: 'open',
            reportedBy: user?.id,
          }))
        : [{
            id: `inc-${Date.now()}`,
            title: incidentTitle,
            description: formDesc.trim(),
            category: formType || 'other',
            severity: severity || 'low',
            camperId: null,
            reportedAt: new Date().toISOString(),
            status: 'open',
            reportedBy: user?.id,
          }];
      dispatch({ type: 'ADD_INCIDENT', payload: fallbackIncidents });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          background: 'var(--card-bg, #FFFFFF)',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(27,120,101,0.06) 0%, rgba(27,120,101,0.01) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1B7865 0%, #0F5244 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(27,120,101,0.3)',
              }}
            >
              <IconShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text, #0F172A)' }}>
                Report New Incident
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)', margin: '2px 0 0 0' }}>
                Log health, welfare, or safety incidents for one or multiple campers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              border: 'none',
              background: 'rgba(100, 116, 139, 0.08)',
              color: 'var(--text-muted, #64748B)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Form Content Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Multi-Camper Selection Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text, #0F172A)' }}>
                  Campers Involved ({selectedCamperIds.length})
                </label>
                {selectedCamperIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#EF4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <IconTrash size={14} /> Clear selection
                  </button>
                )}
              </div>

              {/* Selected Campers Chips */}
              {selectedCamperIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 12,
                    padding: 10,
                    borderRadius: 14,
                    background: 'rgba(27, 120, 101, 0.06)',
                    border: '1px solid rgba(27, 120, 101, 0.15)',
                    maxHeight: 110,
                    overflowY: 'auto',
                  }}
                >
                  {selectedCamperIds.map((id) => {
                    const c = state.campers.find((camper) => camper.id === id);
                    if (!c) return null;
                    return (
                      <span
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          background: '#1B7865',
                          color: '#FFFFFF',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 6px rgba(27,120,101,0.2)',
                        }}
                      >
                        {c.name}
                        <button
                          type="button"
                          onClick={() => toggleCamperSelection(id)}
                          style={{
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.25)',
                            color: '#FFF',
                            borderRadius: 9999,
                            width: 16,
                            height: 16,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <IconX size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search & Multi-select Dropdown */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border, #CBD5E1)',
                    background: 'var(--input-bg, #FFFFFF)',
                  }}
                >
                  <IconSearch size={18} color="var(--text-muted, #64748B)" />
                  <input
                    type="text"
                    value={camperSearch}
                    onChange={(e) => {
                      setCamperSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search camper by name or reg # to add..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      color: 'var(--text, #0F172A)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    style={{
                      border: 'none',
                      background: 'rgba(27, 120, 101, 0.1)',
                      color: '#1B7865',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Select All ({filteredCampers.length})
                  </button>
                </div>

                {/* Dropdown list */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '105%',
                      left: 0,
                      right: 0,
                      maxHeight: 220,
                      overflowY: 'auto',
                      background: 'var(--card-bg, #FFFFFF)',
                      border: '1px solid var(--border, #CBD5E1)',
                      borderRadius: 16,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                      zIndex: 10,
                      padding: 6,
                    }}
                  >
                    {filteredCampers.length === 0 ? (
                      <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted, #64748B)', fontSize: '0.8125rem' }}>
                        No campers found matching "{camperSearch}"
                      </div>
                    ) : (
                      filteredCampers.map((c) => {
                        const isSelected = selectedCamperIds.includes(c.id);
                        const group = GROUPS.find((g) => g.id === c.group);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCamperSelection(c.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(27, 120, 101, 0.08)' : 'transparent',
                              transition: 'background 0.15s ease',
                              marginBottom: 2,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 6,
                                  border: isSelected ? 'none' : '2px solid var(--border, #CBD5E1)',
                                  background: isSelected ? '#1B7865' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFF',
                                }}
                              >
                                {isSelected && <IconCheck size={14} stroke={3} />}
                              </div>

                              {/* Camper Name Cleanly - NO BRACKETS IN FRONT */}
                              <div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #0F172A)' }}>
                                  {c.name}
                                </span>
                                {c.registrationNumber && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', marginLeft: 8 }}>
                                    #{c.registrationNumber}
                                  </span>
                                )}
                              </div>
                            </div>

                            {group?.name && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 9999,
                                  background: 'rgba(100, 116, 139, 0.1)',
                                  color: 'var(--text-muted, #64748B)',
                                }}
                              >
                                {group.name}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: 8, color: 'var(--text, #0F172A)' }}>
                Incident Category
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INCIDENT_TYPES.map((t) => {
                  const isActive = formType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 9999, // fully rounded
                        border: isActive ? `2px solid ${t.color}` : '1px solid var(--border, #CBD5E1)',
                        background: isActive ? `${t.color}15` : 'transparent',
                        color: isActive ? t.color : 'var(--text, #0F172A)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Selector */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: 8, color: 'var(--text, #0F172A)' }}>
                Severity Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {SEVERITIES.map((s) => {
                  const isActive = severity === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 9999, // fully rounded
                        border: isActive ? `2px solid ${s.color}` : '1px solid var(--border, #CBD5E1)',
                        background: isActive ? s.color : 'transparent',
                        color: isActive ? '#FFFFFF' : 'var(--text, #0F172A)',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Incident Title (Optional) & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--text, #0F172A)' }}>
                  Incident Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Minor Injury during football"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border, #CBD5E1)',
                    background: 'var(--input-bg, #FFFFFF)',
                    fontSize: '0.875rem',
                    color: 'var(--text, #0F172A)',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--text, #0F172A)' }}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sports Pitch / Dorm A"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border, #CBD5E1)',
                    background: 'var(--input-bg, #FFFFFF)',
                    fontSize: '0.875rem',
                    color: 'var(--text, #0F172A)',
                  }}
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: 6, color: 'var(--text, #0F172A)' }}>
                Detailed Description <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                placeholder="Describe what happened, observations, and immediate actions taken..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'var(--input-bg, #FFFFFF)',
                  fontSize: '0.875rem',
                  color: 'var(--text, #0F172A)',
                  resize: 'vertical',
                  minHeight: 85,
                }}
              />
            </div>

            {/* Action Buttons with fully rounded corners */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 22px',
                  borderRadius: 9999, // fully rounded
                  border: '1px solid var(--border, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--text, #0F172A)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 26px',
                  borderRadius: 9999, // fully rounded
                  border: 'none',
                  background: 'linear-gradient(135deg, #1B7865 0%, #0F5244 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(27, 120, 101, 0.35)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <IconPlus size={18} />
                {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
