import React, { useState, useEffect } from 'react';
import locationApi from '../../api/locationApi';
import type { LocationNode, LocationType } from '../../api/locationApi';

interface Props {
    value?: number | null; // Selected location ID
    onChange: (locationId: number | null, location: LocationNode | null) => void;
    label?: string;
    required?: boolean;
}

const levels: { type: LocationType; label: string }[] = [
    { type: 'PROVINCE', label: 'Province' },
    { type: 'DISTRICT', label: 'District' },
    { type: 'SECTOR', label: 'Sector' },
    { type: 'CELL', label: 'Cell' },
    { type: 'VILLAGE', label: 'Village' },
];

export default function HierarchicalLocationPicker({ value, onChange, label, required }: Props) {
    const [selections, setSelections] = useState<(number | null)[]>([null, null, null, null, null]);
    const [options, setOptions] = useState<LocationNode[][]>([[], [], [], [], []]);
    const [loading, setLoading] = useState<boolean[]>([false, false, false, false, false]);

    // Load provinces on mount
    useEffect(() => {
        loadLevel(0, null);
    }, []);

    // When value changes externally, we should try to trace back the hierarchy
    // For now, we reset if value is null
    useEffect(() => {
        if (!value) {
            setSelections([null, null, null, null, null]);
        }
    }, [value]);

    const loadLevel = async (levelIndex: number, parentId: number | null) => {
        setLoading(prev => {
            const copy = [...prev];
            copy[levelIndex] = true;
            return copy;
        });

        try {
            let data: LocationNode[];
            if (parentId === null) {
                // Load provinces
                data = await locationApi.byType('PROVINCE');
            } else {
                // Load children of parent
                data = await locationApi.children(parentId);
            }
            setOptions(prev => {
                const copy = [...prev];
                copy[levelIndex] = data;
                // Clear subsequent levels
                for (let i = levelIndex + 1; i < 5; i++) {
                    copy[i] = [];
                }
                return copy;
            });
        } catch (err) {
            console.error('Failed to load locations', err);
        } finally {
            setLoading(prev => {
                const copy = [...prev];
                copy[levelIndex] = false;
                return copy;
            });
        }
    };

    const handleSelect = (levelIndex: number, locationId: string) => {
        const id = locationId ? parseInt(locationId, 10) : null;

        // Update selections
        const newSelections = [...selections];
        newSelections[levelIndex] = id;
        // Clear subsequent selections
        for (let i = levelIndex + 1; i < 5; i++) {
            newSelections[i] = null;
        }
        setSelections(newSelections);

        // Clear subsequent options
        setOptions(prev => {
            const copy = [...prev];
            for (let i = levelIndex + 1; i < 5; i++) {
                copy[i] = [];
            }
            return copy;
        });

        // Find the selected location
        const selectedLocation = options[levelIndex].find(loc => loc.id === id) || null;

        // Load next level if applicable
        if (id && levelIndex < 4) {
            loadLevel(levelIndex + 1, id);
        }

        // Report the deepest selection as the value
        const deepestSelection = id;
        onChange(deepestSelection, selectedLocation);
    };

    // Find the deepest selected level for display
    const getDeepestSelection = () => {
        for (let i = 4; i >= 0; i--) {
            if (selections[i]) {
                const loc = options[i].find(o => o.id === selections[i]);
                return loc;
            }
        }
        return null;
    };

    const selectedLocation = getDeepestSelection();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {label && (
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.5rem'
            }}>
                {levels.map((level, idx) => {
                    const isDisabled = idx > 0 && !selections[idx - 1];
                    const hasOptions = options[idx].length > 0;
                    const shouldShow = idx === 0 || selections[idx - 1];

                    if (!shouldShow) return null;

                    return (
                        <div key={level.type} style={{ minWidth: '150px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                color: '#6b7280',
                                marginBottom: '0.25rem',
                                letterSpacing: '0.5px'
                            }}>
                                {level.label}
                            </label>
                            <select
                                value={selections[idx] ?? ''}
                                onChange={(e) => handleSelect(idx, e.target.value)}
                                disabled={isDisabled || loading[idx]}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.875rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: isDisabled ? '#f3f4f6' : 'white',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="">
                                    {loading[idx] ? 'Loading...' : hasOptions ? `Select ${level.label}` : `No ${level.label}s`}
                                </option>
                                {options[idx].map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>

            {selectedLocation && (
                <div style={{
                    padding: '0.5rem 0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.85rem',
                    color: '#166534'
                }}>
                    <span style={{ fontWeight: 500 }}>Selected:</span> {selectedLocation.path || selectedLocation.name}
                </div>
            )}
        </div>
    );
}
