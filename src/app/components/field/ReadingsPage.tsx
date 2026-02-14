"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  TextField,
  Typography,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";

interface ReadingsPageProps {
  fieldUserId: string;
  fieldUsername: string;
  onLogout: () => void;
}

interface Meter {
  unitId: string;
  meterId: string;
  amrId: string | null;
  meterType: string;
  currentReading?: string;
  lastReadingDate?: string;
  fieldSortOrder?: number;
}

interface Community {
  id: string;
  name: string;
}

interface ApiResponse {
  data?: Meter[];
  message?: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function ReadingsPage({
  fieldUserId,
  fieldUsername,
  onLogout,
}: ReadingsPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null,
  );
  const [communityInputValue, setCommunityInputValue] = useState("");
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [selectedMeters, setSelectedMeters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [draggedMeter, setDraggedMeter] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["meterType", "amrId", "unitId", "reading"])
  );

  const toggleColumn = (columnName: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  // Handler functions - must be defined before meterRows useMemo
  const handleReadingChange = (meterId: string, value: string) => {
    setReadings((prev) => ({
      ...prev,
      [meterId]: value,
    }));
  };

  const handleDragStart = (meterId: string) => {
    setDraggedMeter(meterId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetMeterId: string) => {
    if (!draggedMeter || draggedMeter === targetMeterId) {
      setDraggedMeter(null);
      return;
    }

    reorderMeters(draggedMeter, targetMeterId);
    setDraggedMeter(null);
  };

  const handleTouchStart = (e: React.TouchEvent, meterId: string) => {
    const target = e.currentTarget as HTMLElement;
    const touch = e.touches[0];
    
    setDraggedMeter(meterId);
    setTouchStartY(touch.clientY);
    setDraggedElement(target);
    
    target.style.opacity = "0.5";
    target.style.backgroundColor = "#e3f2fd";
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedMeter || !touchStartY) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    const elements = document.querySelectorAll('[data-meter-row]');
    let targetMeterId: string | null = null;
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        targetMeterId = element.getAttribute('data-meter-id');
      }
    });
    
    elements.forEach((element) => {
      const elementMeterId = element.getAttribute('data-meter-id');
      if (elementMeterId === targetMeterId && elementMeterId !== draggedMeter) {
        (element as HTMLElement).style.backgroundColor = "#bbdefb";
      } else if (elementMeterId !== draggedMeter) {
        (element as HTMLElement).style.backgroundColor = "";
      }
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedMeter || !touchStartY) return;
    
    const touch = e.changedTouches[0];
    const currentY = touch.clientY;
    
    const elements = document.querySelectorAll('[data-meter-row]');
    let targetMeterId: string | null = null;
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        targetMeterId = element.getAttribute('data-meter-id');
      }
    });
    
    if (targetMeterId && targetMeterId !== draggedMeter) {
      reorderMeters(draggedMeter, targetMeterId);
    }
    
    elements.forEach((element) => {
      (element as HTMLElement).style.opacity = "";
      (element as HTMLElement).style.backgroundColor = "";
    });
    
    if (draggedElement) {
      draggedElement.style.opacity = "";
      draggedElement.style.backgroundColor = "";
    }
    
    setDraggedMeter(null);
    setTouchStartY(null);
    setDraggedElement(null);
  };

  const handleToggleMeter = (meterId: string) => {
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

  // Common reorder logic - must be before meterRows
  const reorderMeters = async (sourceMeterId: string, targetMeterId: string) => {
    const draggedIndex = meters.findIndex((m) => m.meterId === sourceMeterId);
    const targetIndex = meters.findIndex((m) => m.meterId === targetMeterId);

    const newMeters = [...meters];
    const [removed] = newMeters.splice(draggedIndex, 1);
    newMeters.splice(targetIndex, 0, removed);

    setMeters(newMeters);

    try {
      const sortOrder = newMeters.map((m, index) => ({
        meterId: m.meterId,
        fieldSortOrder: index,
      }));

      await axios.post("/api/field/meters/sort", {
        communityId: selectedCommunity?.id,
        sortOrder,
      });
    } catch (err) {
      console.error("Error saving sort order:", err);
    }
  };

  const meterRows = useMemo(
    () =>
      meters.map((meter) => (
        <TableRow
          key={meter.meterId}
          data-meter-row
          data-meter-id={meter.meterId}
          draggable
          onDragStart={() => handleDragStart(meter.meterId)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(meter.meterId)}
          onTouchStart={(e) => handleTouchStart(e, meter.meterId)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => handleToggleMeter(meter.meterId)}
          sx={{
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            "&:active": {
              cursor: "grabbing",
            },
            bgcolor: selectedMeters.has(meter.meterId)
              ? "action.selected"
              : "transparent",
            "&:hover": {
              bgcolor: selectedMeters.has(meter.meterId)
                ? "action.selected"
                : "action.hover",
            },
            transition: "background-color 0.2s ease",
          }}
        >
          <TableCell padding="none" sx={{ pl: 0.5 }}>
            <IconButton
              size="small"
              sx={{
                p: 0.25,
                cursor: "grab",
                touchAction: "none",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <DragIndicatorIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </TableCell>
          {visibleColumns.has("meterType") && (
            <TableCell sx={{ py: 0.75, px: 0.75 }}>
              <Typography variant="body2" fontSize="0.75rem">
                {meter.meterType || "N/A"}
              </Typography>
            </TableCell>
          )}
          {visibleColumns.has("amrId") && (
            <TableCell sx={{ py: 0.75, px: 0.75 }}>
              <Typography variant="body2" fontSize="0.75rem">
                {meter.amrId || "N/A"}
              </Typography>
            </TableCell>
          )}
          {visibleColumns.has("unitId") && (
            <TableCell sx={{ py: 0.75, px: 0.75 }}>
              <Typography variant="body2" fontSize="0.75rem" fontWeight={500}>
                {meter.unitId}
              </Typography>
            </TableCell>
          )}
          {visibleColumns.has("reading") && (
            <TableCell sx={{ py: 0.75, px: 0.75 }}>
              <TextField
                type="number"
                size="small"
                placeholder="Enter"
                value={readings[meter.meterId] || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  handleReadingChange(meter.meterId, e.target.value);
                  if (e.target.value && !selectedMeters.has(meter.meterId)) {
                    setSelectedMeters((prev) => new Set(prev).add(meter.meterId));
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                inputProps={{
                  step: "0.01",
                  min: "0",
                }}
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    padding: "4px 6px",
                    fontSize: "0.75rem",
                  },
                }}
              />
            </TableCell>
          )}
        </TableRow>
      )),
    [meters, selectedMeters, readings, visibleColumns],
  );

  // Fetch communities on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axios.get<Community[]>("/api/field/communities");
        setCommunities(
          response.data.map((c) => ({
            id: c.id,
            name: c.name,
          })),
        );
      } catch (err) {
        console.error("Error fetching communities:", err);
        setMessage("Failed to load communities");
        setMessageType("error");
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
        const response = await axios.get<ApiResponse>("/api/field/meters", {
          params: { communityId: selectedCommunity.id },
        });
        setMeters(response.data.data || []);
        setReadings({});
        setSelectedMeters(new Set());
        setMessage("");
      } catch (err) {
        console.error("Error fetching meters:", err);
        setMessage("Failed to load meters");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    fetchMeters();
  }, [selectedCommunity]);

  const handleSave = async () => {
    const metersToSave = meters.filter((m) => selectedMeters.has(m.meterId));

    if (metersToSave.length === 0) {
      setMessage("Please add readings to at least one meter");
      setMessageType("error");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const readingsPayload = metersToSave.map((meter) => ({
        meterId: meter.meterId,
        amrId: meter.amrId || "",
        reading: readings[meter.meterId],
      }));

      await axios.post("/api/field/readings", {
        fieldUserId,
        communityId: selectedCommunity?.id,
        readingDate: today,
        readings: readingsPayload,
      });

      setMessage(`✓ Successfully saved ${metersToSave.length} reading(s)`);
      setMessageType("success");
      setReadings({});
      setSelectedMeters(new Set());

      setTimeout(() => {
        const fetchMeters = async () => {
          try {
            const response = await axios.get<ApiResponse>("/api/field/meters", {
              params: { communityId: selectedCommunity?.id },
            });
            setMeters(response.data.data || []);
          } catch (err) {
            console.error("Error refreshing meters:", err);
          }
        };
        fetchMeters();
      }, 500);
    } catch (err: unknown) {
      const axiosError = err as AxiosErrorResponse;
      const errorMessage =
        axiosError.response?.data?.message || "Failed to save readings";
      setMessage(`Error: ${errorMessage}`);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 1 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 1.5,
          py: 1,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Readings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fieldUsername}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="center">
            {selectedMeters.size > 0 && (
              <LoadingButton
                onClick={handleSave}
                loading={saving}
                variant="contained"
                size="small"
                sx={{ py: 0.5, fontSize: "0.75rem", minWidth: 70 }}
              >
                Save
              </LoadingButton>
            )}
            <Button
              onClick={onLogout}
              variant="outlined"
              size="small"
              sx={{ minWidth: 65, py: 0.5 }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box
        sx={{
          px: 1.5,
          pt: 1.5,
          overflowY: "auto",
          height: "calc(100vh - 80px)",
          scrollbarWidth: "thick",
          scrollbarColor: "#888 #f1f1f1",
          "&::-webkit-scrollbar": {
            width: "12px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "6px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        }}
      >
        {/* Community Selection */}
        <Card sx={{ p: 1.5, mb: 1.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Select Community
          </Typography>
          <Autocomplete
            fullWidth
            options={communities}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedCommunity}
            onChange={(event, newValue) => {
              setSelectedCommunity(newValue);
            }}
            inputValue={communityInputValue}
            onInputChange={(event, newInputValue) => {
              setCommunityInputValue(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search community..."
                size="small"
              />
            )}
            renderOption={(props, option, { inputValue }) => {
              const matches = match(option.name, inputValue, {
                insideWords: true,
              });
              const parts = parse(option.name, matches);
              return (
                <li {...props} key={option.id}>
                  <div>
                    {parts.map((part, index) => (
                      <span
                        key={index}
                        style={{
                          fontWeight: part.highlight ? 700 : 400,
                        }}
                      >
                        {part.text}
                      </span>
                    ))}
                  </div>
                </li>
              );
            }}
          />
        </Card>

        {/* Message Display */}
        {message && (
          <Alert
            severity={messageType}
            onClose={() => setMessage("")}
            sx={{ mb: 1.5 }}
          >
            {message}
          </Alert>
        )}

        {/* Meters Table */}
        {selectedCommunity && (
          <Card>
            {loading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Loading meters...
                </Typography>
              </Box>
            ) : meters.length > 0 ? (
              <>
                {/* Header */}
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {meters.length} Meter{meters.length !== 1 ? "s" : ""}
                  </Typography>
                  <Button
                    size="small"
                    onClick={(e) => {
                      const menu = document.getElementById("column-menu");
                      if (menu) {
                        menu.style.display = menu.style.display === "none" ? "block" : "none";
                      }
                    }}
                    sx={{ fontSize: "0.75rem", py: 0.25 }}
                  >
                    Columns
                  </Button>
                  <Box
                    id="column-menu"
                    sx={{
                      display: "none",
                      position: "absolute",
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      zIndex: 10,
                      right: 16,
                      top: "100%",
                      mt: 0.5,
                    }}
                  >
                    {["meterType", "amrId", "unitId", "reading"].map((col) => (
                      <Box
                        key={col}
                        onClick={() => toggleColumn(col)}
                        sx={{
                          p: 1,
                          cursor: "pointer",
                          bgcolor: visibleColumns.has(col) ? "action.selected" : "transparent",
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          fontSize: "0.8rem",
                          minWidth: 120,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col)}
                          onChange={() => {}}
                          style={{ cursor: "pointer" }}
                        />
                        {col === "meterType" && "Meter Type"}
                        {col === "amrId" && "AMR ID"}
                        {col === "unitId" && "Unit NO"}
                        {col === "reading" && "Reading"}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          padding="none"
                          sx={{
                            bgcolor: "grey.50",
                            width: 35,
                            pl: 0.5,
                          }}
                        />
                        <TableCell
                          sx={{
                            bgcolor: "grey.50",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            py: 0.75,
                            px: 0.75,
                            display: visibleColumns.has("meterType") ? "table-cell" : "none",
                          }}
                        >
                          Meter Type
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "grey.50",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            py: 0.75,
                            px: 0.75,
                            display: visibleColumns.has("amrId") ? "table-cell" : "none",
                          }}
                        >
                          AMR ID
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "grey.50",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            py: 0.75,
                            px: 0.75,
                            display: visibleColumns.has("unitId") ? "table-cell" : "none",
                          }}
                        >
                          Unit NO
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "grey.50",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            py: 0.75,
                            px: 0.75,
                            display: visibleColumns.has("reading") ? "table-cell" : "none",
                          }}
                        >
                          Reading
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meterRows}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Action Bar */}
                {selectedMeters.size > 0 && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderTop: 1,
                      borderColor: "divider",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "grey.50",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                      {selectedMeters.size} selected
                    </Typography>
                    <LoadingButton
                      onClick={handleSave}
                      loading={saving}
                      variant="contained"
                      size="small"
                      sx={{ py: 0.5, fontSize: "0.8rem" }}
                    >
                      Save ({selectedMeters.size})
                    </LoadingButton>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No meters found
                </Typography>
              </Box>
            )}
          </Card>
        )}
      </Box>
    </Box>
  );
}