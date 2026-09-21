import { Chip } from "@mui/material";
import type { ServiceRequestPriority, ServiceRequestStatus } from "@/api/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/domain/serviceRequests";

/**
 * Status and priority are encoded with colour *and* text, never colour alone,
 * so the meaning survives greyscale and colour-vision deficiency. The value is
 * bare - no fill, no outline - so the colour of the dot and the label carry it.
 *
 * The hue comes from a custom property published by the application theme.
 * It is applied through `sx` rather than a stylesheet class because MUI injects
 * its own `Chip` styles after `index.css` and would otherwise win the cascade.
 */
function tint(variable: string) {
  return {
    color: `var(${variable})`,
    backgroundColor: "transparent",
    border: "none",
    height: 22,
    fontSize: "0.8125rem",
    fontWeight: 600,
    px: 0,
    "& .MuiChip-label": { paddingInline: 0 },
  };
}

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      className={`badge badge--${status}`}
      sx={tint(`--status-${status}`)}
      label={
        <>
          <span className="visually-hidden">Status: </span>
          {STATUS_LABELS[status]}
        </>
      }
    />
  );
}

export function PriorityBadge({
  priority,
}: {
  priority: ServiceRequestPriority;
}) {
  return (
    <Chip
      size="small"
      variant="outlined"
      className={`badge badge--${priority}`}
      sx={tint(`--priority-${priority}`)}
      label={
        <>
          <span className="visually-hidden">Priority: </span>
          {PRIORITY_LABELS[priority]}
        </>
      }
    />
  );
}
