import { useState } from 'react'
import { useUpdateServiceRequestStatus } from '@/api/queries'
import {
  type ServiceRequest,
  type ServiceRequestStatus,
} from '@/api/types'
import { ALLOWED_TRANSITIONS, STATUS_LABELS, isTerminal } from '@/domain/serviceRequests'
import { Alert, ApiErrorAlert } from '@/components/Alert'
import { Field } from '@/components/Field'
import { Spinner } from '@/components/Spinner'

interface StatusUpdatePanelProps {
  request: ServiceRequest
  onUpdated: (updated: ServiceRequest) => void
}

/**
 * The parent mounts this with `key={request.id}-{request.version}`, so a
 * successful update - or a refetch after a conflict - gives a fresh form
 * instead of one holding a selection that no longer applies.
 */

const NOTE_MAX_LENGTH = 500

/**
 * Drives `PATCH /requests/{id}/status`.
 *
 * Only transitions the contract allows are offered, and the `version` last read
 * is echoed back so a concurrent edit is caught by the server as a `409`
 * instead of silently overwriting someone else's change.
 */
export function StatusUpdatePanel({ request, onUpdated }: StatusUpdatePanelProps) {
  const transitions = ALLOWED_TRANSITIONS[request.status]
  const [status, setStatus] = useState<ServiceRequestStatus | ''>('')
  const [note, setNote] = useState('')

  const updateStatus = useUpdateServiceRequestStatus()

  if (isTerminal(request.status)) {
    return (
      <Alert tone="info" title="This request is closed">
        <p>Closed is a terminal state: the status can no longer be changed.</p>
      </Alert>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!status) return

    try {
      const updated = await updateStatus.mutateAsync({
        requestId: request.id,
        status,
        version: request.version,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      onUpdated(updated)
    } catch {
      // Rendered below from `updateStatus.error`.
    }
  }

  const error = updateStatus.error

  return (
    <form className="stack stack--tight" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <Field
        label="Move to"
        hint={`Current status: ${STATUS_LABELS[request.status]}.`}
      >
        {(props) => (
          <select
            {...props}
            className="control"
            value={status}
            onChange={(event) => setStatus(event.target.value as ServiceRequestStatus | '')}
          >
            <option value="">Select a new status&hellip;</option>
            {transitions.map((target) => (
              <option key={target} value={target}>
                {STATUS_LABELS[target]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Note"
        optional
        hint={`Recorded with the transition. ${note.length}/${NOTE_MAX_LENGTH} characters.`}
      >
        {(props) => (
          <textarea
            {...props}
            className="control"
            rows={3}
            maxLength={NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Password reset and portal access confirmed with the customer."
          />
        )}
      </Field>

      {error ? (
        <ApiErrorAlert
          error={error}
          title={error.isConflict ? 'Someone else updated this request' : undefined}
        >
          {error.isConflict ? (
            <p>
              The latest version has been loaded. Review the changes above and apply your update
              again.
            </p>
          ) : null}
        </ApiErrorAlert>
      ) : null}

      <button
        type="submit"
        className="button button--primary"
        disabled={!status || updateStatus.isPending}
      >
        {updateStatus.isPending ? <Spinner label={null} /> : null}
        {updateStatus.isPending ? 'Updating…' : 'Update status'}
      </button>

      <p className="inline-meta">
        Version {request.version} is sent with the update to detect concurrent changes.
      </p>
    </form>
  )
}
