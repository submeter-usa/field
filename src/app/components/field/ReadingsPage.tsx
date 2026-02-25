"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SwapVertIcon from "@mui/icons-material/SwapVert";
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
  previousReading?: string;
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
  // ── NEW: tab state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0); // 0 = Enter Readings, 1 = Reorder

  // ── Everything below is UNCHANGED from your existing code ───────────────────
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
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["amrId", "unitId", "previousReading", "reading", "usage"]),
  );

  const metersRef = useRef(meters);
  const selectedCommunityRef = useRef(selectedCommunity);
  useEffect(() => {
    metersRef.current = meters;
  }, [meters]);
  useEffect(() => {
    selectedCommunityRef.current = selectedCommunity;
  }, [selectedCommunity]);

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

  const handleReadingChange = useCallback((meterId: string, value: string) => {
    setReadings((prev) => ({ ...prev, [meterId]: value }));
  }, []);

  const reorderMeters = useCallback(
    async (sourceMeterId: string, targetMeterId: string) => {
      const currentMeters = metersRef.current;
      const draggedIndex = currentMeters.findIndex(
        (m) => m.meterId === sourceMeterId,
      );
      const targetIndex = currentMeters.findIndex(
        (m) => m.meterId === targetMeterId,
      );

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newMeters = [...currentMeters];
      const [removed] = newMeters.splice(draggedIndex, 1);
      newMeters.splice(targetIndex, 0, removed);

      setMeters(newMeters);

      try {
        const sortOrder = newMeters.map((m, index) => ({
          meterId: m.meterId,
          fieldSortOrder: index,
        }));
        await axios.post("/api/field/meters/sort", {
          communityId: selectedCommunityRef.current?.id,
          sortOrder,
        });
      } catch (err) {
        console.error("Error saving sort order:", err);
      }
    },
    [],
  );

  const handleDragStart = useCallback((meterId: string) => {
    setDraggedMeter(meterId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetMeterId: string) => {
      setDraggedMeter((current) => {
        if (!current || current === targetMeterId) return null;
        reorderMeters(current, targetMeterId);
        return null;
      });
    },
    [reorderMeters],
  );

  const touchDraggedMeter = useRef<string | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, meterId: string) => {
      touchDraggedMeter.current = meterId;
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = "0.5";
      target.style.backgroundColor = "#e3f2fd";
    },
    [],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchDraggedMeter.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const elements = document.querySelectorAll("[data-meter-row]");

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const el = element as HTMLElement;
      const isOver = touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      const isSource =
        element.getAttribute("data-meter-id") === touchDraggedMeter.current;

      if (isOver && !isSource) {
        el.style.backgroundColor = "#bbdefb";
      } else if (!isSource) {
        el.style.backgroundColor = "";
      }
    });
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const source = touchDraggedMeter.current;
      if (!source) return;

      const touch = e.changedTouches[0];
      const elements = document.querySelectorAll("[data-meter-row]");
      let targetMeterId: string | null = null;

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          targetMeterId = element.getAttribute("data-meter-id");
        }
      });

      elements.forEach((element) => {
        const el = element as HTMLElement;
        el.style.opacity = "";
        el.style.backgroundColor = "";
      });

      touchDraggedMeter.current = null;

      if (targetMeterId && targetMeterId !== source) {
        reorderMeters(source, targetMeterId);
      }
    },
    [reorderMeters],
  );

  const handleToggleMeter = useCallback((meterId: string) => {
    setSelectedMeters((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(meterId)) {
        newSelected.delete(meterId);
      } else {
        newSelected.add(meterId);
      }
      return newSelected;
    });
  }, []);

  // ── Enter Readings rows — no drag, no row-click select, free scroll ──────────
  const readingRows = useMemo(
    () =>
      meters.map((meter) => {
        const currVal = readings[meter.meterId] ?? meter.currentReading;
        const prevVal = meter.previousReading;
        const usage =
          currVal !== undefined &&
          currVal !== "" &&
          prevVal !== undefined &&
          prevVal !== null
            ? Number(currVal) - Number(prevVal)
            : null;

        return (
          <TableRow
            key={meter.meterId}
            // No onClick, no cursor, no selection highlight — just a plain row
            sx={{ "&:hover": { bgcolor: "action.hover" } }}
          >
            {/* AMR ID */}
            {visibleColumns.has("amrId") && (
              <TableCell sx={{ py: 0.75, px: 0.75 }}>
                <Typography variant="body2" fontSize="0.75rem">
                  {meter.amrId || "N/A"}
                </Typography>
              </TableCell>
            )}

            {/* Unit NO */}
            {visibleColumns.has("unitId") && (
              <TableCell sx={{ py: 0.75, px: 0.75 }}>
                <Typography variant="body2" fontSize="0.75rem" fontWeight={500}>
                  {meter.unitId}
                </Typography>
              </TableCell>
            )}

            {/* Previous Reading */}
            {visibleColumns.has("previousReading") && (
              <TableCell sx={{ py: 0.75, px: 0.75 }}>
                <Typography
                  variant="body2"
                  fontSize="0.75rem"
                  color="text.secondary"
                >
                  {meter.previousReading ?? "—"}
                </Typography>
              </TableCell>
            )}

            {/* Current Reading input */}
            {visibleColumns.has("reading") && (
              <TableCell sx={{ py: 0.75, px: 0.75 }}>
                <TextField
                  type="number"
                  size="small"
                  placeholder={meter.currentReading ?? "Enter"}
                  value={readings[meter.meterId] || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleReadingChange(meter.meterId, e.target.value);
                    // selectedMeters still tracks what to save — just no visual highlight
                    if (e.target.value) {
                      setSelectedMeters((prev) =>
                        new Set(prev).add(meter.meterId),
                      );
                    } else {
                      setSelectedMeters((prev) => {
                        const next = new Set(prev);
                        next.delete(meter.meterId);
                        return next;
                      });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  inputProps={{ step: "0.01", min: "0" }}
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

            {/* Usage */}
            {visibleColumns.has("usage") && (
              <TableCell sx={{ py: 0.75, px: 0.75 }}>
                <Typography
                  variant="body2"
                  fontSize="0.75rem"
                  fontWeight={usage !== null ? 500 : 400}
                  color={
                    usage === null
                      ? "text.secondary"
                      : usage < 0
                        ? "error.main"
                        : "success.main"
                  }
                >
                  {usage !== null ? usage.toFixed(2) : "—"}
                </Typography>
              </TableCell>
            )}
          </TableRow>
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meters, readings, visibleColumns],
  );

  // ── Reorder rows — your exact existing drag rows ──────────────────────────────
  const reorderRows = useMemo(
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
            "&:active": { cursor: "grabbing" },
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
          {/* Drag handle */}
          <TableCell padding="none" sx={{ pl: 0.5 }}>
            <IconButton
              size="small"
              sx={{ p: 0.25, cursor: "grab", touchAction: "none" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <DragIndicatorIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </TableCell>
          <TableCell sx={{ py: 0.75, px: 0.75 }}>
            <Typography variant="body2" fontSize="0.75rem">
              {meter.amrId || "N/A"}
            </Typography>
          </TableCell>
          <TableCell sx={{ py: 0.75, px: 0.75 }}>
            <Typography variant="body2" fontSize="0.75rem" fontWeight={500}>
              {meter.unitId}
            </Typography>
          </TableCell>
          <TableCell sx={{ py: 0.75, px: 0.75 }}>
            <Typography variant="body2" fontSize="0.75rem" color="text.secondary">
              {meter.meterType || "—"}
            </Typography>
          </TableCell>
        </TableRow>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meters, selectedMeters],
  );

  // Fetch communities on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axios.get<Community[]>("/api/field/communities");
        setCommunities(response.data.map((c) => ({ id: c.id, name: c.name })));
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
    const metersToSave = meters.filter(
      (m) =>
        selectedMeters.has(m.meterId) &&
        readings[m.meterId] !== undefined &&
        readings[m.meterId] !== "",
    );

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
        amrId: meter.amrId ?? null,
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

      setTimeout(async () => {
        try {
          const response = await axios.get<ApiResponse>("/api/field/meters", {
            params: { communityId: selectedCommunity?.id },
          });
          setMeters(response.data.data || []);
        } catch (err) {
          console.error("Error refreshing meters:", err);
        }
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

  // Column definitions for the toggle menu — UNCHANGED
  const columnDefs = [
    { key: "amrId", label: "AMR ID" },
    { key: "unitId", label: "Unit NO" },
    { key: "previousReading", label: "Prev Reading" },
    { key: "reading", label: "Curr Reading" },
    { key: "usage", label: "Usage" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>

      {/* Header — UNCHANGED except title reflects active tab */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
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
              {activeTab === 0 ? "Enter Readings" : "Reorder Meters"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fieldUsername}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="center">
            {activeTab === 0 && selectedMeters.size > 0 && (
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

      {/* Content — UNCHANGED */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 4 }}>

        {/* Community Selection — UNCHANGED */}
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
            onChange={(event, newValue) => setSelectedCommunity(newValue)}
            inputValue={communityInputValue}
            onInputChange={(event, newInputValue) =>
              setCommunityInputValue(newInputValue)
            }
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
                        style={{ fontWeight: part.highlight ? 700 : 400 }}
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

        {/* Message Display — UNCHANGED */}
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
                {/* Card Header — column toggle only on Enter Readings tab */}
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

                  {/* Columns button — only on Enter Readings tab, UNCHANGED */}
                  {activeTab === 0 && (
                    <>
                      <Button
                        size="small"
                        onClick={() => {
                          const menu = document.getElementById("column-menu");
                          if (menu) {
                            menu.style.display =
                              menu.style.display === "none" ? "block" : "none";
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
                        {columnDefs.map((col) => (
                          <Box
                            key={col.key}
                            onClick={() => toggleColumn(col.key)}
                            sx={{
                              p: 1,
                              cursor: "pointer",
                              bgcolor: visibleColumns.has(col.key)
                                ? "action.selected"
                                : "transparent",
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
                              checked={visibleColumns.has(col.key)}
                              onChange={() => {}}
                              style={{ cursor: "pointer" }}
                            />
                            {col.label}
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Reorder tab hint */}
                  {activeTab === 1 && (
                    <Typography variant="caption" color="text.secondary">
                      Drag to reorder • saves automatically
                    </Typography>
                  )}
                </Box>

                {/* ── Enter Readings tab table ── */}
                {activeTab === 0 && (
                  <TableContainer
                    sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {visibleColumns.has("amrId") && (
                            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>
                              AMR ID
                            </TableCell>
                          )}
                          {visibleColumns.has("unitId") && (
                            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>
                              Unit NO
                            </TableCell>
                          )}
                          {visibleColumns.has("previousReading") && (
                            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>
                              Prev Reading
                            </TableCell>
                          )}
                          {visibleColumns.has("reading") && (
                            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>
                              Curr Reading
                            </TableCell>
                          )}
                          {visibleColumns.has("usage") && (
                            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>
                              Usage
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>{readingRows}</TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* ── Reorder tab table ── */}
                {activeTab === 1 && (
                  <TableContainer
                    sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="none" sx={{ bgcolor: "grey.50", width: 35, pl: 0.5 }} />
                          <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>AMR ID</TableCell>
                          <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>Unit NO</TableCell>
                          <TableCell sx={{ bgcolor: "grey.50", fontWeight: 600, fontSize: "0.75rem", py: 0.75, px: 0.75 }}>Meter Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>{reorderRows}</TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Action Bar — UNCHANGED, only on Enter Readings tab */}
                {activeTab === 0 && selectedMeters.size > 0 && (
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize="0.8rem"
                    >
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

      {/* Floating scroll buttons — UNCHANGED, raised above bottom nav */}
      <Box
        sx={{
          position: "fixed",
          right: 12,
          zIndex: 999,
          bottom: "calc(env(safe-area-inset-bottom) + 70px)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Button
          variant="contained"
          size="small"
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: "50%",
            p: 0,
            fontSize: "1.2rem",
            boxShadow: 3,
            opacity: 0.85,
          }}
          onClick={() =>
            window.scrollBy({ top: -window.innerHeight * 0.7, behavior: "smooth" })
          }
        >
          ↑
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: "50%",
            p: 0,
            fontSize: "1.2rem",
            boxShadow: 3,
            opacity: 0.85,
          }}
          onClick={() =>
            window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" })
          }
        >
          ↓
        </Button>
      </Box>

      {/* NEW: Bottom tab navigation */}
      <BottomNavigation
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderTop: 1,
          borderColor: "divider",
          height: "calc(56px + env(safe-area-inset-bottom))",
          pb: "env(safe-area-inset-bottom)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <BottomNavigationAction label="Enter Readings" icon={<EditNoteIcon />} />
        <BottomNavigationAction label="Reorder" icon={<SwapVertIcon />} />
      </BottomNavigation>

    </Box>
  );
}