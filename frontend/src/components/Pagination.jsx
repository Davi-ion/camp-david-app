import React from 'react';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconChevronsLeft, 
  IconChevronsRight 
} from '@tabler/icons-react';

export default function Pagination({ 
  currentPage = 1, 
  totalItems = 0, 
  pageSize = 20, 
  onPageChange, 
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = ''
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className={`pagination-controller ${className}`} style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '14px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--card-bg, #ffffff)',
      borderRadius: '0 0 16px 16px',
      fontSize: '0.875rem'
    }}>
      {/* Left: Summary and Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
          Showing <span style={{ color: 'var(--text, #0F172A)', fontWeight: 700 }}>{startItem}–{endItem}</span> of <span style={{ color: 'var(--text, #0F172A)', fontWeight: 700 }}>{totalItems}</span> campers
        </div>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted, #64748B)' }}>
            <span style={{ fontSize: '0.8125rem' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input-field"
              style={{
                padding: '4px 8px',
                fontSize: '0.8125rem',
                borderRadius: 8,
                border: '1px solid var(--border, #E2E8F0)',
                background: '#F8FAFC',
                cursor: 'pointer',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* First Page */}
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First Page"
          className="btn btn-secondary btn-icon"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border, #E2E8F0)',
            background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
            color: currentPage <= 1 ? '#94A3B8' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <IconChevronsLeft size={18} />
        </button>

        {/* Previous Page */}
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
          className="btn btn-secondary btn-icon"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border, #E2E8F0)',
            background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
            color: currentPage <= 1 ? '#94A3B8' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <IconChevronLeft size={18} />
        </button>

        {/* Page Number Pills */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: '#94A3B8', fontSize: '0.875rem' }}>
                  •••
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  minWidth: 34,
                  height: 34,
                  padding: '0 8px',
                  borderRadius: 8,
                  border: isActive ? '1px solid var(--primary, #0F766E)' : '1px solid var(--border, #E2E8F0)',
                  background: isActive ? 'var(--primary, #0F766E)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive ? '0 2px 4px rgba(15, 118, 110, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
          className="btn btn-secondary btn-icon"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border, #E2E8F0)',
            background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
            color: currentPage >= totalPages ? '#94A3B8' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <IconChevronRight size={18} />
        </button>

        {/* Last Page */}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
          className="btn btn-secondary btn-icon"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border, #E2E8F0)',
            background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
            color: currentPage >= totalPages ? '#94A3B8' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <IconChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
