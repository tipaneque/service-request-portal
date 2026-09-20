import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateServiceRequest } from '@/api/queries'
import { PRIORITIES, PRIORITY_LABELS } from '@/domain/serviceRequests'
import { useAuth } from '@/auth/AuthContext'
import { ApiErrorAlert } from '@/components/Alert'
import { Field } from '@/components/Field'
import { Spinner } from '@/components/Spinner'
import {
  CATEGORY_SUGGESTIONS,
  createRequestSchema,
  type CreateRequestFormValues,
} from './requestSchema'

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
        <span aria-hidden="true"> / </span>
        <span>New request</span>
      </nav>

      <div className="page-header">
        <div className="page-header__text">
          <h1>New service request</h1>
          <p className="page-header__description">
            Log a customer issue. The request is created with status{' '}
            <strong>Open</strong> and can be progressed from its detail page.
          </p>
        </div>
      </div>

      <section className="panel panel--padded">
        {createRequest.error && !createRequest.error.fieldErrors ? (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <ApiErrorAlert error={createRequest.error} title="The request could not be created" />
          </div>
        ) : null}

        <form onSubmit={(event) => void onSubmit(event)} noValidate>
          <div className="form-grid form-grid--two">
            <div className="form-grid__full">
              <Field label="Title" error={errors.title?.message} hint="A short summary, 3-120 characters.">
                {(props) => (
                  <input
                    {...props}
                    {...register('title')}
                    className="control"
                    type="text"
                    autoComplete="off"
                    placeholder="Unable to access customer portal"
                  />
                )}
              </Field>
            </div>

            <div className="form-grid__full">
              <Field
                label="Description"
                error={errors.description?.message}
                hint="What happened, what was expected, and any error messages. 10-2000 characters."
              >
                {(props) => (
                  <textarea
                    {...props}
                    {...register('description')}
                    className="control"
                    rows={6}
                    placeholder="The customer receives &quot;Account locked&quot; after signing in with valid credentials."
                  />
                )}
              </Field>
            </div>

            <Field
              label="Category"
              error={errors.category?.message}
              hint="Free text; pick a suggestion or type your own."
            >
              {(props) => (
                <>
                  <input
                    {...props}
                    {...register('category')}
                    className="control"
                    type="text"
                    list="category-suggestions"
                    autoComplete="off"
                    placeholder="Access"
                  />
                  <datalist id="category-suggestions">
                    {CATEGORY_SUGGESTIONS.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>

            <Field label="Priority" error={errors.priority?.message}>
              {(props) => (
                <select {...props} {...register('priority')} className="control">
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Requester name" error={errors.requesterName?.message}>
              {(props) => (
                <input
                  {...props}
                  {...register('requesterName')}
                  className="control"
                  type="text"
                  autoComplete="name"
                  placeholder={user?.name ?? 'Example Customer'}
                />
              )}
            </Field>

            <Field
              label="Requester email"
              error={errors.requesterEmail?.message}
              hint="Used for follow-up on this request."
            >
              {(props) => (
                <input
                  {...props}
                  {...register('requesterEmail')}
                  className="control"
                  type="email"
                  autoComplete="email"
                  placeholder="customer@example.com"
                />
              )}
            </Field>
          </div>

          <div className="form-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? <Spinner label={null} /> : null}
              {isSubmitting ? 'Creating…' : 'Create request'}
            </button>
            <Link className="button button--secondary" to="/requests">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
