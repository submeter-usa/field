"use client";

import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
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
      setMessage("Please select at least one meter");
      setMessageType("error");
      return;
    }

    const metersWithoutReadings = metersToSave.filter(
      (m) => !readings[m.meterId],
    );
    if (metersWithoutReadings.length > 0) {
      setMessage("Please enter readings for all selected meters");
      setMessageType("error");
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const readingsPayload = metersToSave.map((meter) => ({
        meterId: meter.meterId,
        amrId: meter.amrId || "", // Use empty string if amrId is null/undefined
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

      // Refresh meters
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          px: 2,
          py: 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Readings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Logged in as: <strong>{fieldUsername}</strong>
            </Typography>
          </Box>
          <Button
            onClick={onLogout}
            variant="outlined"
            size="small"
            sx={{ minWidth: 80 }}
          >
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, pt: 3, maxWidth: 1200, mx: "auto" }}>
        {/* Community Selection */}
        <Card sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
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
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}

        {/* Meters Table */}
        {selectedCommunity && (
          <Card sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <CircularProgress size={40} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Loading meters...
                </Typography>
              </Box>
            ) : meters.length > 0 ? (
              <>
                {/* Table Header */}
                <Box
                  sx={{
                    pl: 1,
                    pr: 2.5,
                    py: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Checkbox
                      checked={
                        selectedMeters.size === meters.length &&
                        meters.length > 0
                      }
                      indeterminate={
                        selectedMeters.size > 0 &&
                        selectedMeters.size < meters.length
                      }
                      onChange={handleSelectAll}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {meters.length} Meter{meters.length !== 1 ? "s" : ""}
                    </Typography>
                  </Stack>
                </Box>

                {/* Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          padding="checkbox"
                          sx={{ bgcolor: "background.neutral" }}
                        >
                          Select
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "background.neutral",
                            fontWeight: 600,
                          }}
                        >
                          Type
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "background.neutral",
                            fontWeight: 600,
                          }}
                        >
                          AMR ID
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "background.neutral",
                            fontWeight: 600,
                          }}
                        >
                          Unit ID
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "background.neutral",
                            fontWeight: 600,
                          }}
                        >
                          Reading
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meters.map((meter) => (
                        <TableRow
                          key={meter.meterId}
                          sx={{
                            bgcolor: selectedMeters.has(meter.meterId)
                              ? "action.selected"
                              : "transparent",
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedMeters.has(meter.meterId)}
                              onChange={() => handleSelectMeter(meter.meterId)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {meter.meterType || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {meter.amrId || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {meter.unitId}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ pl: 0.5 }}>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Enter"
                              value={readings[meter.meterId] || ""}
                              onChange={(e) =>
                                handleReadingChange(
                                  meter.meterId,
                                  e.target.value,
                                )
                              }
                              inputProps={{
                                step: "0.01",
                                min: "0",
                              }}
                              disabled={!selectedMeters.has(meter.meterId)}
                              fullWidth
                              sx={{ maxWidth: 120 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Action Bar */}
                {selectedMeters.size > 0 && (
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      borderTop: 1,
                      borderColor: "divider",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {selectedMeters.size} selected
                    </Typography>
                    <LoadingButton
                      onClick={handleSave}
                      loading={saving}
                      variant="contained"
                      size="medium"
                    >
                      Save ({selectedMeters.size})
                    </LoadingButton>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No meters found for this community
                </Typography>
              </Box>
            )}
          </Card>
        )}
      </Box>
    </Box>
  );
}
