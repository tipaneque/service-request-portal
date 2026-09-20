import { z } from 'zod'
import { PRIORITIES } from '@/domain/serviceRequests'

/**
 * Client-side mirror of the `CreateServiceRequest` schema in the OpenAPI
 * document. The bounds are copied from the contract so the user gets immediate
 * feedback, but the server stays authoritative: a `422` response is mapped back
 * onto these same fields.
 */
export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long.')
    .max(120, 'Title must not exceed 120 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long.')
    .max(2000, 'Description must not exceed 2000 characters.'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters long.')
    .max(50, 'Category must not exceed 50 characters.'),
  priority: z.enum(PRIORITIES, { message: 'Select a priority.' }),
  requesterName: z
    .string()
    .trim()
    .min(2, 'Requester name must be at least 2 characters long.')
    .max(100, 'Requester name must not exceed 100 characters.'),
  requesterEmail: z
    .string()
    .trim()
    .min(1, 'Enter a contact email address.')
    .email('Enter a valid email address.')
    .max(254, 'Email address must not exceed 254 characters.'),
})

export type CreateRequestFormValues = z.infer<typeof createRequestSchema>

/** Categories offered as suggestions; the field itself is free text per the contract. */
export const CATEGORY_SUGGESTIONS = [
  'Access',
  'Billing',
  'Network',
  'Outage',
  'Hardware',
  'Integration',
  'Performance',
  'Reporting',
  'Other',
] as const
