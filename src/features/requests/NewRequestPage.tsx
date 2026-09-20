import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Paper, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/SendOutlined'
import { useCreateServiceRequest } from '@/api/queries'
import { PRIORITIES, PRIORITY_LABELS } from '@/domain/serviceRequests'
import { useAuth } from '@/auth/AuthContext'
import { ApiErrorAlert } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import {
  CATEGORY_SUGGESTIONS,
  createRequestSchema,
  type CreateRequestFormValues,
} from './requestSchema'

/**
 * `register` hands back a `ref` meant for the DOM control, but spreading it
 * onto a `TextField` would attach it to the wrapping `FormControl`. Routing it
 * through `inputRef` keeps react-hook-form pointed at the real input.
 */
function bind({ ref, ...rest }: UseFormRegisterReturn) {
  return { ...rest, inputRef: ref }
}

export function NewRequestPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createRequest = useCreateServiceRequest()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    // Validate on blur, then re-validate as the user fixes a field: this avoids
    // shouting at someone who has not finished typing yet.
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      requesterName: '',
      requesterEmail: '',
    },
  })

  useEffect(() => {
    document.title = 'New service request | Service Request Portal'
  }, [])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createRequest.mutateAsync(values)
      navigate(`/requests/${created.id}`, { replace: true, state: { justCreated: true } })
    } catch (error) {
      // Server-side validation wins: map each `422` field message back onto the
      // matching input so the correction happens where the problem is.
      const fieldErrors =
        error && typeof error === 'object' && 'fieldErrors' in error
          ? (error as { fieldErrors?: Record<string, string[]> }).fieldErrors
          : undefined

      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (field in values && messages[0]) {
            setError(field as keyof CreateRequestFormValues, {
              type: 'server',
              message: messages[0],
            })
          }
        }
      }
      // Anything else is rendered by the alert below via `createRequest.error`.
    }
  })

  return (
    <div className="stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/requests">Service requests</Link>
        <span aria-hidden="true">/</span>
        <span>New request</span>
      </nav>

      <div className="page-header">
        <div className="page-header__text">
          <Typography className="page-header__title" component="h1" variant="h3">
            New service request
          </Typography>
          <Typography className="page-header__description">
            Log a customer issue. The request is created with status <strong>Open</strong> and can
            be progressed from its detail page.
          </Typography>
        </div>
      </div>

      <Paper className="panel panel--padded" component="section" elevation={0}>
        {createRequest.error && !createRequest.error.fieldErrors ? (
          <Box sx={{ mb: 3 }}>
            <ApiErrorAlert error={createRequest.error} title="The request could not be created" />
          </Box>
        ) : null}

        <form onSubmit={(event) => void onSubmit(event)} noValidate>
          <div className="form-grid form-grid--two">
            <div className="form-grid__full">
              <TextField
                {...bind(register('title'))}
                label="Title"
                fullWidth
                autoComplete="off"
                placeholder="Unable to access customer portal"
                error={Boolean(errors.title)}
                helperText={errors.title?.message ?? 'A short summary, 3-120 characters.'}
              />
            </div>

            <div className="form-grid__full">
              <TextField
                {...bind(register('description'))}
                label="Description"
                fullWidth
                multiline
                minRows={5}
                placeholder={'The customer receives "Account locked" after signing in with valid credentials.'}
                error={Boolean(errors.description)}
                helperText={
                  errors.description?.message ??
                  'What happened, what was expected, and any error messages. 10-2000 characters.'
                }
              />
            </div>

            <div>
              <TextField
                {...bind(register('category'))}
                label="Category"
                fullWidth
                autoComplete="off"
                placeholder="Access"
                slotProps={{ htmlInput: { list: 'category-suggestions' } }}
                error={Boolean(errors.category)}
                helperText={
                  errors.category?.message ?? 'Free text; pick a suggestion or type your own.'
                }
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <TextField
              {...bind(register('priority'))}
              label="Priority"
              select
              fullWidth
              slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
              error={Boolean(errors.priority)}
              helperText={errors.priority?.message ?? ' '}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </TextField>

            <TextField
              {...bind(register('requesterName'))}
              label="Requester name"
              fullWidth
              autoComplete="name"
              placeholder={user?.name ?? 'Example Customer'}
              error={Boolean(errors.requesterName)}
              helperText={errors.requesterName?.message ?? ' '}
            />

            <TextField
              {...bind(register('requesterEmail'))}
              label="Requester email"
              type="email"
              fullWidth
              autoComplete="email"
              placeholder="customer@example.com"
              error={Boolean(errors.requesterEmail)}
              helperText={
                errors.requesterEmail?.message ?? 'Used for follow-up on this request.'
              }
            />
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <Spinner label={null} /> : <SendIcon />}
            >
              {isSubmitting ? 'Creating…' : 'Create request'}
            </Button>
            <Button component={Link} variant="outlined" size="large" to="/requests">
              Cancel
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  )
}
