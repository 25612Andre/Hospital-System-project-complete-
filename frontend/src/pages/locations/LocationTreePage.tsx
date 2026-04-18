import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import locationApi from '../../api/locationApi';
import type { LocationDTO, LocationType } from '../../api/locationApi';

const typeHierarchy: LocationType[] = ['PROVINCE', 'DISTRICT', 'SECTOR', 'CELL', 'VILLAGE'];

const typeLabels: Record<LocationType, string> = {
  PROVINCE: 'Provinces',
  DISTRICT: 'Districts',
  SECTOR: 'Sectors',
  CELL: 'Cells',
  VILLAGE: 'Villages',
};

const typeColors: Record<LocationType, string> = {
  PROVINCE: '#6366f1',
  DISTRICT: '#8b5cf6',
  SECTOR: '#ec4899',
  CELL: '#f59e0b',
  VILLAGE: '#10b981',
};

interface BreadcrumbItem {
  id: number | null;
  name: string;
  type: LocationType | null;
}

export default function LocationTreePage() {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'All Provinces', type: null }
  ]);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = useState<LocationType>('PROVINCE');
  const [typeCounts, setTypeCounts] = useState<Record<LocationType, number>>({
    PROVINCE: 0,
    DISTRICT: 0,
    SECTOR: 0,
    CELL: 0,
    VILLAGE: 0,
  });

  // Load locations based on current navigation
  const loadLocations = async () => {
    setLoading(true);
    try {
      let data: LocationDTO[];
      if (searchTerm.trim()) {
        const response = await locationApi.filter({ q: searchTerm, size: 100 });
        data = response.content;
      } else if (currentParentId === null) {
        data = await locationApi.byType('PROVINCE');
      } else {
        data = await locationApi.children(currentParentId);
      }
      setLocations(data);
    } catch (err) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  // Load counts for each type (optimized)
  const loadCounts = async () => {
    try {
      const counts = await locationApi.stats();
      setTypeCounts({
        PROVINCE: counts.PROVINCE || 0,
        DISTRICT: counts.DISTRICT || 0,
        SECTOR: counts.SECTOR || 0,
        CELL: counts.CELL || 0,
        VILLAGE: counts.VILLAGE || 0,
      });
    } catch (err) {
      console.error('Failed to load counts', err);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [currentParentId, searchTerm]);

  useEffect(() => {
    loadCounts();
  }, []);

  // Navigate into a location (drill down)
  const handleDrillDown = (location: LocationDTO) => {
    const currentTypeIndex = typeHierarchy.indexOf(location.type);
    if (currentTypeIndex < typeHierarchy.length - 1) {
      setBreadcrumbs([...breadcrumbs, { id: location.id, name: location.name, type: location.type }]);
      setCurrentParentId(location.id);
      setCurrentLevel(typeHierarchy[currentTypeIndex + 1]);
      setSearchTerm('');
    }
  };

  // Navigate back via breadcrumb
  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    const lastItem = newBreadcrumbs[newBreadcrumbs.length - 1];
    setCurrentParentId(lastItem.id);
    if (lastItem.type === null) {
      setCurrentLevel('PROVINCE');
    } else {
      const typeIndex = typeHierarchy.indexOf(lastItem.type);
      setCurrentLevel(typeHierarchy[Math.min(typeIndex + 1, typeHierarchy.length - 1)]);
    }
  };

  const getNextLevelLabel = (type: LocationType): string => {
    const index = typeHierarchy.indexOf(type);
    if (index < typeHierarchy.length - 1) {
      return typeLabels[typeHierarchy[index + 1]];
    }
    return '';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>📍 Locations</h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
              Manage geographic areas and regions for patients and medical staff.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!window.confirm("Are you sure? This will wipe ALL locations. This is useful for clearing the 5-level hierarchy and starting fresh.")) return;
                setLoading(true);
                try {
                  await locationApi.clear();
                  toast.success("All locations cleared!");
                  setBreadcrumbs([{ id: null, name: 'Locations', type: null }]);
                  setCurrentParentId(null);
                  loadLocations();
                  loadCounts();
                } catch (err) {
                  toast.error('Failed to clear locations');
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Clear All
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("This will import the standard 5-level hierarchy (Province -> Village).")) return;
                setLoading(true);
                try {
                  const res = await locationApi.clearAndImport();
                  toast.success(`Successfully imported ${res.processedRows} locations!`);
                  loadLocations();
                  loadCounts();
                } catch (err) {
                  toast.error('Failed to import locations');
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Import Standard Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.5rem'
        }}>
          {typeHierarchy.map(type => (
            <div
              key={type}
              style={{
                background: currentLevel === type ? typeColors[type] : 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '0.75rem',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{typeCounts[type].toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.9, textTransform: 'uppercase' }}>{typeLabels[type]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        background: '#f8fafc',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
      }}>
        <span style={{ color: '#64748b', marginRight: '0.25rem' }}>📂</span>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span style={{ color: '#cbd5e1' }}>›</span>}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              style={{
                background: index === breadcrumbs.length - 1 ? '#1e293b' : 'transparent',
                color: index === breadcrumbs.length - 1 ? 'white' : '#475569',
                border: 'none',
                padding: '0.35rem 0.6rem',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: index === breadcrumbs.length - 1 ? 600 : 400
              }}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Search Bar and Simple Add */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.875rem 1rem',
            fontSize: '0.95rem',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <input 
             id="new-loc-name"
             type="text" 
             placeholder="New Location Name..."
             style={{ padding: '0.875rem 1rem', border: '2px solid #e2e8f0', borderRadius: '10px', minWidth: '200px' }}
           />
           <button 
             onClick={async () => {
               const nameEl = document.getElementById('new-loc-name') as HTMLInputElement;
               const name = nameEl.value.trim();
               if (!name) return;
               try {
                 await locationApi.create({ name, code: name.toUpperCase().replace(/\s+/g, '_'), type: currentLevel || 'PROVINCE', parentId: currentParentId || undefined });
                 toast.success("Location added!");
                 nameEl.value = "";
                 loadLocations();
                 loadCounts();
               } catch (err) {
                 toast.error("Failed to add location");
               }
             }}
             style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
           >
             Add
           </button>
        </div>
      </div>

      {/* Current Level Label */}
      {!searchTerm && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', background: typeColors[currentLevel], borderRadius: '2px' }}></span>
            {typeLabels[currentLevel]}
          </h2>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{locations.length} items</span>
        </div>
      )}

      {/* Locations Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#64748b' }}>
          Loading...
        </div>
      ) : locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
          <p>{searchTerm ? 'No locations match your search' : 'No locations at this level'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {locations.map(loc => {
            const canDrillDown = typeHierarchy.indexOf(loc.type) < typeHierarchy.length - 1;
            return (
              <div
                key={loc.id}
                onClick={() => canDrillDown && handleDrillDown(loc)}
                style={{
                  background: 'white',
                  borderRadius: '10px',
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  cursor: canDrillDown ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (canDrillDown) {
                    e.currentTarget.style.borderColor = typeColors[loc.type];
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Type Badge */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: typeColors[loc.type],
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0 10px 0 6px',
                  textTransform: 'uppercase'
                }}>
                  {loc.type}
                </div>

                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                  {loc.code}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                  {loc.name}
                </div>
                {loc.path && (
                  <div 
                    title={loc.path}
                    style={{ 
                      fontSize: '0.8rem', 
                      color: '#475569', 
                      background: '#f1f5f9',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      marginTop: '0.5rem',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.4rem'
                    }}
                  >
                    <span style={{ flexShrink: 0, marginTop: '0.1rem' }}>📍</span> 
                    <span>{loc.path}</span>
                  </div>
                )}
                {canDrillDown && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: typeColors[loc.type] }}>
                    View {getNextLevelLabel(loc.type)} →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
