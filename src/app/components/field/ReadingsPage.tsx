'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { readingsStyles as styles } from './styles';

interface ReadingsPageProps {
  fieldUserId: string;
  fieldUsername: string;
  onLogout: () => void;
}

interface Meter {
  unitId: string;
  meterId: string;
  amrId: string;
  meterType: string;
  currentReading?: string;
  lastReadingDate?: string;
}

interface Community {
  id: string;
  name: string;
}

/**
 * ReadingsPage
 * 
 * Simple field readings interface:
 * - Community autocomplete (search)
 * - Meters table with: Select | Select All | Meter Type | AMR ID | Unit ID | Current Reading
 * - Bulk save readings
 * 
 * No admin complexity - just data entry
 */
export default function ReadingsPage({
  fieldUserId,
  fieldUsername,
  onLogout,
}: ReadingsPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [selectedMeters, setSelectedMeters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch communities on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axios.get('/api/field/communities');
        setCommunities(response.data);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setMessage('Failed to load communities');
        setMessageType('error');
      }
    };
    fetchCommunities();
  }, []);

  // Fetch meters when community changes
  useEffect(() => {
    if (!selectedCommunity) {
      setMeters([]);
      return;
    }

    const fetchMeters = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/field/meters', {
          params: { communityId: selectedCommunity },
        });
        setMeters(response.data.data || []);
        setReadings({});
        setSelectedMeters(new Set());
        setMessage('');
      } catch (err) {
        console.error('Error fetching meters:', err);
        setMessage('Failed to load meters');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    fetchMeters();
  }, [selectedCommunity]);

  const handleReadingChange = (meterId: string, value: string) => {
    setReadings((prev) => ({
      ...prev,
      [meterId]: value,
    }));
  };

  const handleSelectMeter = (meterId: string) => {
    setSelectedMeters((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(meterId)) {
        newSelected.delete(meterId);
      } else {
        newSelected.add(meterId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedMeters.size === meters.length) {
      setSelectedMeters(new Set());
    } else {
      setSelectedMeters(new Set(meters.map((m) => m.meterId)));
    }
  };

  const handleSave = async () => {
    const metersToSave = meters.filter((m) => selectedMeters.has(m.meterId));

    if (metersToSave.length === 0) {
      setMessage('Please select at least one meter');
      setMessageType('error');
      return;
    }

    const metersWithoutReadings = metersToSave.filter((m) => !readings[m.meterId]);
    if (metersWithoutReadings.length > 0) {
      setMessage('Please enter readings for all selected meters');
      setMessageType('error');
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      // Bulk save: one API call with all readings
      const readingsPayload = metersToSave.map((meter) => ({
        meterId: meter.meterId,
        amrId: meter.amrId,
        reading: readings[meter.meterId],
      }));

      await axios.post('/api/field/readings', {
        fieldUserId,
        communityId: selectedCommunity,
        readingDate: today,
        readings: readingsPayload,
      });

      setMessage(`✓ Successfully saved ${metersToSave.length} reading(s)`);
      setMessageType('success');
      setReadings({});
      setSelectedMeters(new Set());

      // Refresh meters to show updated readings
      setTimeout(() => {
        const fetchMeters = async () => {
          try {
            const response = await axios.get('/api/field/meters', {
              params: { communityId: selectedCommunity },
            });
            setMeters(response.data.data || []);
          } catch (err) {
            console.error('Error refreshing meters:', err);
          }
        };
        fetchMeters();
      }, 500);
    } catch (err: unknown) {
      setMessage(`Error: ${err.response?.data?.message || 'Failed to save readings'}`);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Readings</h1>
          <p style={styles.userName}>
            Logged in as: <strong>{fieldUsername}</strong>
          </p>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        {/* Community Selection */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>Select Community</label>
          <div style={styles.autocompleteContainer}>
            <input
              type="text"
              placeholder="Search community..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={styles.searchInput}
              autoComplete="off"
            />
            {showDropdown && searchTerm && filteredCommunities.length > 0 && (
              <div style={styles.dropdown}>
                {filteredCommunities.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: selectedCommunity === c.id ? '#f0f0f0' : 'white',
                    }}
                    onClick={() => {
                      setSelectedCommunity(c.id);
                      setSearchTerm('');
                      setShowDropdown(false);
                    }}
                    role="option"
                    aria-selected={selectedCommunity === c.id}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
            {selectedCommunity && (
              <div style={styles.selectedCommunity}>
                ✓ {communities.find((c) => c.id === selectedCommunity)?.name}
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            style={{
              ...styles.message,
              backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
              color: messageType === 'success' ? '#155724' : '#721c24',
            }}
            role="alert"
          >
            {message}
          </div>
        )}

        {/* Meters Table */}
        {selectedCommunity && (
          <div style={styles.section}>
            {loading ? (
              <div style={styles.loading}>Loading meters...</div>
            ) : meters.length > 0 ? (
              <>
                {/* Table Header with Select All */}
                <div style={styles.tableHeader}>
                  <div style={styles.tableHeaderContent}>
                    <button
                      onClick={handleSelectAll}
                      style={styles.selectAllBtn}
                      title={
                        selectedMeters.size === meters.length
                          ? 'Deselect All'
                          : 'Select All'
                      }
                      aria-label={
                        selectedMeters.size === meters.length
                          ? 'Deselect all meters'
                          : 'Select all meters'
                      }
                    >
                      {selectedMeters.size === meters.length ? '☑' : '☐'}
                    </button>
                    <span style={styles.tableTitle}>
                      {meters.length} Meter{meters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Meters Table */}
                <div style={styles.tableContainer}>
                  <table style={styles.table} role="grid">
                    <thead>
                      <tr style={styles.tableHeadRow} role="row">
                        <th style={styles.thCheckbox} role="columnheader">Select</th>
                        <th style={styles.th} role="columnheader">Meter Type</th>
                        <th style={styles.th} role="columnheader">AMR ID</th>
                        <th style={styles.th} role="columnheader">Unit ID</th>
                        <th style={styles.th} role="columnheader">Current Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meters.map((meter) => (
                        <tr
                          key={meter.meterId}
                          style={{
                            ...styles.tableRow,
                            backgroundColor: selectedMeters.has(meter.meterId)
                              ? '#f9f9f9'
                              : 'white',
                          }}
                          role="row"
                        >
                          <td style={styles.tdCheckbox} role="gridcell">
                            <input
                              type="checkbox"
                              checked={selectedMeters.has(meter.meterId)}
                              onChange={() => handleSelectMeter(meter.meterId)}
                              style={styles.checkbox}
                              aria-label={`Select meter ${meter.meterId}`}
                            />
                          </td>
                          <td style={styles.td} role="gridcell">
                            {meter.meterType || 'N/A'}
                          </td>
                          <td style={styles.td} role="gridcell">
                            {meter.amrId || 'N/A'}
                          </td>
                          <td style={styles.td} role="gridcell">
                            {meter.unitId}
                          </td>
                          <td style={styles.td} role="gridcell">
                            <input
                              type="number"
                              placeholder="Enter reading"
                              value={readings[meter.meterId] || ''}
                              onChange={(e) =>
                                handleReadingChange(meter.meterId, e.target.value)
                              }
                              style={styles.readingInput}
                              step="0.01"
                              min="0"
                              disabled={!selectedMeters.has(meter.meterId)}
                              aria-label={`Reading for meter ${meter.meterId}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save Button (shown when meters selected) */}
                {selectedMeters.size > 0 && (
                  <div style={styles.actionBar}>
                    <span style={styles.actionBarText}>
                      {selectedMeters.size} selected
                    </span>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        ...styles.saveButton,
                        opacity: saving ? 0.6 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                      aria-busy={saving}
                    >
                      {saving ? 'Saving...' : `Save (${selectedMeters.size})`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.noData}>No meters found for this community</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}