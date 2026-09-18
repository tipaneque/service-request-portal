import type { ServiceRequest } from '@/api/types'

/**
 * Deterministic seed data. A fixed set keeps tests and demos reproducible:
 * the same filters always return the same rows.
 */
interface SeedRow {
  title: string
  description: string
  category: string
  priority: ServiceRequest['priority']
  status: ServiceRequest['status']
  requesterName: string
  requesterEmail: string
  /** Hours subtracted from the fixed base date to build `createdAt`. */
  hoursAgo: number
  version: number
}

/**
 * Timestamps are anchored to the moment the data is built rather than to a
 * calendar date, so the demo always reads as a live queue ("3 hours ago")
 * instead of ageing into "11 months ago". The offsets between records are
 * fixed, so ordering and paging stay deterministic.
 */
const baseDate = () => Date.now()

const ROWS: SeedRow[] = [
  {
    title: 'Unable to access customer portal',
    description:
      'The customer receives "Account locked" after signing in with valid credentials. Resetting the password does not help.',
    category: 'Access',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Example Customer',
    requesterEmail: 'customer@example.com',
    hoursAgo: 4,
    version: 1,
  },
  {
    title: 'Duplicate invoice on February statement',
    description:
      'Invoice INV-88213 appears twice on the February billing statement for the same amount.',
    category: 'Billing',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    requesterName: 'Second Customer',
    requesterEmail: 'second.customer@example.com',
    hoursAgo: 19,
    version: 4,
  },
  {
    title: 'Self-service app is down for all users',
    description:
      'Every sign-in attempt returns HTTP 503 since 06:00 UTC across web and mobile clients.',
    category: 'Outage',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    requesterName: 'Operations Desk',
    requesterEmail: 'ops.desk@example.com',
    hoursAgo: 3,
    version: 6,
  },
  {
    title: 'VPN drops every few minutes',
    description:
      'The site-to-site VPN tunnel to the Lisbon office drops roughly every five minutes since the last upgrade.',
    category: 'Network',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Marta Ferreira',
    requesterEmail: 'marta.ferreira@example.com',
    hoursAgo: 27,
    version: 1,
  },
  {
    title: 'Password reset email never arrives',
    description:
      'Requesting a password reset reports success but no message reaches the customer inbox or spam folder.',
    category: 'Access',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    requesterName: 'Jonas Weber',
    requesterEmail: 'jonas.weber@example.com',
    hoursAgo: 53,
    version: 5,
  },
  {
    title: 'Card payment declined with no reason code',
    description:
      'Checkout declines every Visa card without returning a reason code to the customer or to support.',
    category: 'Billing',
    priority: 'CRITICAL',
    status: 'OPEN',
    requesterName: 'Priya Nair',
    requesterEmail: 'priya.nair@example.com',
    hoursAgo: 8,
    version: 2,
  },
  {
    title: 'Monthly usage report shows stale data',
    description:
      'The usage report exported on the first of the month still contains figures from two months earlier.',
    category: 'Reporting',
    priority: 'LOW',
    status: 'CLOSED',
    requesterName: 'Tomas Silva',
    requesterEmail: 'tomas.silva@example.com',
    hoursAgo: 120,
    version: 7,
  },
  {
    title: 'Mobile app crashes on the orders screen',
    description:
      'Opening the orders screen on Android 14 closes the application immediately after the list renders.',
    category: 'Mobile',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    requesterName: 'Ana Costa',
    requesterEmail: 'ana.costa@example.com',
    hoursAgo: 31,
    version: 3,
  },
  {
    title: 'Two-factor codes rejected as expired',
    description:
      'Authenticator codes are rejected as expired even when entered within a couple of seconds.',
    category: 'Access',
    priority: 'HIGH',
    status: 'RESOLVED',
    requesterName: 'Liam OConnor',
    requesterEmail: 'liam.oconnor@example.com',
    hoursAgo: 74,
    version: 4,
  },
  {
    title: 'Printer queue stuck in the Porto branch',
    description: 'All jobs sent to the third-floor printer stay queued and never print or fail.',
    category: 'Hardware',
    priority: 'LOW',
    status: 'OPEN',
    requesterName: 'Rui Marques',
    requesterEmail: 'rui.marques@example.com',
    hoursAgo: 46,
    version: 1,
  },
  {
    title: 'Data export truncated at 1000 rows',
    description: 'CSV exports silently stop at one thousand rows with no warning shown to the user.',
    category: 'Reporting',
    priority: 'MEDIUM',
    status: 'OPEN',
    requesterName: 'Sofia Almeida',
    requesterEmail: 'sofia.almeida@example.com',
    hoursAgo: 12,
    version: 1,
  },
  {
    title: 'Webhook deliveries failing with timeout',
    description:
      'Outbound webhooks to the partner endpoint time out after thirty seconds and are not retried.',
    category: 'Integration',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    requesterName: 'Integration Team',
    requesterEmail: 'integrations@example.com',
    hoursAgo: 22,
    version: 2,
  },
  {
    title: 'Customer name shown with wrong encoding',
    description:
      'Accented characters in customer names render as question marks throughout the admin console.',
    category: 'Data Quality',
    priority: 'LOW',
    status: 'RESOLVED',
    requesterName: 'Ines Rocha',
    requesterEmail: 'ines.rocha@example.com',
    hoursAgo: 98,
    version: 3,
  },
  {
    title: 'Email notifications delayed by several hours',
    description:
      'Ticket notification emails arrive between three and six hours after the triggering event.',
    category: 'Notifications',
    priority: 'MEDIUM',
    status: 'OPEN',
    requesterName: 'Carlos Mendes',
    requesterEmail: 'carlos.mendes@example.com',
    hoursAgo: 6,
    version: 1,
  },
  {
    title: 'Search returns no results for valid terms',
    description:
      'Searching the knowledge base for common terms returns an empty result set for every user.',
    category: 'Search',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Helena Braga',
    requesterEmail: 'helena.braga@example.com',
    hoursAgo: 15,
    version: 1,
  },
  {
    title: 'SSO login loops back to the sign-in page',
    description:
      'After authenticating with the corporate identity provider the browser returns to the sign-in page.',
    category: 'Access',
    priority: 'CRITICAL',
    status: 'RESOLVED',
    requesterName: 'Nuno Pereira',
    requesterEmail: 'nuno.pereira@example.com',
    hoursAgo: 63,
    version: 8,
  },
  {
    title: 'Refund not reflected on the customer balance',
    description:
      'A refund processed last week is confirmed by the payment provider but the balance is unchanged.',
    category: 'Billing',
    priority: 'HIGH',
    status: 'CLOSED',
    requesterName: 'Beatriz Lopes',
    requesterEmail: 'beatriz.lopes@example.com',
    hoursAgo: 150,
    version: 6,
  },
  {
    title: 'Latency spike on the reporting API',
    description:
      'The reporting API responds in over eight seconds during business hours, up from under one second.',
    category: 'Performance',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    requesterName: 'Platform Team',
    requesterEmail: 'platform@example.com',
    hoursAgo: 35,
    version: 2,
  },
  {
    title: 'Attachment upload fails above 5 MB',
    description:
      'Uploading an attachment larger than five megabytes fails with a generic error and no guidance.',
    category: 'Attachments',
    priority: 'LOW',
    status: 'OPEN',
    requesterName: 'Diogo Freitas',
    requesterEmail: 'diogo.freitas@example.com',
    hoursAgo: 40,
    version: 1,
  },
  {
    title: 'Scheduled backup job did not run',
    description:
      'The nightly backup job reported no execution for three consecutive nights without alerting.',
    category: 'Infrastructure',
    priority: 'CRITICAL',
    status: 'CLOSED',
    requesterName: 'Backup Operations',
    requesterEmail: 'backup.ops@example.com',
    hoursAgo: 200,
    version: 9,
  },
  {
    title: 'Incorrect tax rate applied to EU orders',
    description:
      'Orders shipped within the European Union are charged the domestic tax rate instead of the local one.',
    category: 'Billing',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Finance Desk',
    requesterEmail: 'finance.desk@example.com',
    hoursAgo: 9,
    version: 1,
  },
  {
    title: 'Dashboard widgets fail to load on Safari',
    description:
      'On Safari 17 the dashboard widgets stay blank while the same page renders correctly in Chrome.',
    category: 'Compatibility',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    requesterName: 'Marco Dias',
    requesterEmail: 'marco.dias@example.com',
    hoursAgo: 51,
    version: 2,
  },
  {
    title: 'User cannot be removed from the account',
    description:
      'Removing a former employee from the account returns success but the user remains listed.',
    category: 'Access',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    requesterName: 'Catarina Sousa',
    requesterEmail: 'catarina.sousa@example.com',
    hoursAgo: 88,
    version: 4,
  },
  {
    title: 'Phone line disconnected during transfers',
    description:
      'Calls transferred between support queues disconnect after roughly ten seconds of hold music.',
    category: 'Telephony',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Contact Centre',
    requesterEmail: 'contact.centre@example.com',
    hoursAgo: 2,
    version: 1,
  },
  {
    title: 'Audit log missing administrator actions',
    description:
      'Administrator role changes do not appear in the audit log, which blocks the quarterly review.',
    category: 'Compliance',
    priority: 'CRITICAL',
    status: 'OPEN',
    requesterName: 'Compliance Office',
    requesterEmail: 'compliance@example.com',
    hoursAgo: 17,
    version: 1,
  },
  {
    title: 'Contract PDF renders without the signature block',
    description:
      'Generated contract PDFs are missing the signature block on the final page since the template update.',
    category: 'Documents',
    priority: 'MEDIUM',
    status: 'CLOSED',
    requesterName: 'Legal Support',
    requesterEmail: 'legal.support@example.com',
    hoursAgo: 175,
    version: 5,
  },
  {
    title: 'Onboarding wizard skips the address step',
    description:
      'New customers are taken straight from company details to confirmation, leaving the address empty.',
    category: 'Onboarding',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    requesterName: 'Onboarding Team',
    requesterEmail: 'onboarding@example.com',
    hoursAgo: 58,
    version: 2,
  },
  {
    title: 'Rate limit reached on the public API',
    description:
      'A partner integration hits the rate limit within minutes although the agreed quota is much higher.',
    category: 'Integration',
    priority: 'HIGH',
    status: 'RESOLVED',
    requesterName: 'Partner Support',
    requesterEmail: 'partner.support@example.com',
    hoursAgo: 67,
    version: 3,
  },
  {
    title: 'Notification preferences reset after sign-in',
    description:
      'Notification preferences revert to the defaults every time the user signs in from a new device.',
    category: 'Notifications',
    priority: 'LOW',
    status: 'OPEN',
    requesterName: 'Filipa Antunes',
    requesterEmail: 'filipa.antunes@example.com',
    hoursAgo: 29,
    version: 1,
  },
  {
    title: 'Order status stuck on Processing',
    description:
      'Several orders remain in the processing state although the warehouse confirmed dispatch days ago.',
    category: 'Orders',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    requesterName: 'Warehouse Lisbon',
    requesterEmail: 'warehouse.lisbon@example.com',
    hoursAgo: 44,
    version: 3,
  },
  {
    title: 'Screen reader skips the request table headers',
    description:
      'The request table is announced without column headers, so cell values lose their meaning.',
    category: 'Accessibility',
    priority: 'MEDIUM',
    status: 'OPEN',
    requesterName: 'Accessibility Review',
    requesterEmail: 'a11y.review@example.com',
    hoursAgo: 11,
    version: 1,
  },
  {
    title: 'Currency symbol missing on the invoice total',
    description:
      'The invoice total is printed as a bare number without the currency symbol or code.',
    category: 'Billing',
    priority: 'LOW',
    status: 'CLOSED',
    requesterName: 'Accounts Receivable',
    requesterEmail: 'accounts.receivable@example.com',
    hoursAgo: 190,
    version: 4,
  },
  {
    title: 'Wi-Fi unusable in the training room',
    description:
      'Wireless throughput in the training room drops below one megabit whenever a session is running.',
    category: 'Network',
    priority: 'MEDIUM',
    status: 'OPEN',
    requesterName: 'Facilities',
    requesterEmail: 'facilities@example.com',
    hoursAgo: 36,
    version: 1,
  },
  {
    title: 'Deleted requests still appear in search',
    description: 'Requests deleted last month are still returned by the global search index.',
    category: 'Search',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    requesterName: 'Data Team',
    requesterEmail: 'data.team@example.com',
    hoursAgo: 79,
    version: 3,
  },
  {
    title: 'Licence count exceeded without warning',
    description:
      'The account exceeded its licence count and new users were blocked without any prior notification.',
    category: 'Licensing',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'IT Procurement',
    requesterEmail: 'it.procurement@example.com',
    hoursAgo: 25,
    version: 1,
  },
  {
    title: 'Timezone shown incorrectly for scheduled jobs',
    description:
      'Scheduled job times display in UTC although the account timezone is set to Europe/Lisbon.',
    category: 'Scheduling',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    requesterName: 'Operations Desk',
    requesterEmail: 'ops.desk@example.com',
    hoursAgo: 71,
    version: 2,
  },
  {
    title: 'Chat widget blocks the checkout button',
    description:
      'On small screens the chat widget overlaps the checkout button and cannot be dismissed.',
    category: 'Mobile',
    priority: 'HIGH',
    status: 'OPEN',
    requesterName: 'Ecommerce Team',
    requesterEmail: 'ecommerce@example.com',
    hoursAgo: 5,
    version: 1,
  },
  {
    title: 'Password policy rejects valid passphrases',
    description:
      'Long passphrases containing spaces are rejected even though the policy documents them as valid.',
    category: 'Access',
    priority: 'MEDIUM',
    status: 'CLOSED',
    requesterName: 'Security Team',
    requesterEmail: 'security.team@example.com',
    hoursAgo: 210,
    version: 6,
  },
  {
    title: 'Duplicate records created by the import tool',
    description:
      'The nightly CRM import creates duplicate customer records when an email address changes case.',
    category: 'Data Quality',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    requesterName: 'CRM Team',
    requesterEmail: 'crm.team@example.com',
    hoursAgo: 48,
    version: 3,
  },
  {
    title: 'Support portal slow on first load',
    description: 'The first page load of the support portal takes over twelve seconds on a cold cache.',
    category: 'Performance',
    priority: 'LOW',
    status: 'OPEN',
    requesterName: 'Quality Assurance',
    requesterEmail: 'qa@example.com',
    hoursAgo: 33,
    version: 1,
  },
  {
    title: 'Escalation rules not applied to critical tickets',
    description:
      'Critical tickets are not escalated after the agreed thirty-minute threshold expires.',
    category: 'Workflow',
    priority: 'CRITICAL',
    status: 'OPEN',
    requesterName: 'Service Delivery',
    requesterEmail: 'service.delivery@example.com',
    hoursAgo: 1,
    version: 1,
  },
  {
    title: 'Knowledge base article shows a broken image',
    description:
      'The troubleshooting article for printer setup shows a broken image placeholder in every browser.',
    category: 'Content',
    priority: 'LOW',
    status: 'RESOLVED',
    requesterName: 'Content Team',
    requesterEmail: 'content.team@example.com',
    hoursAgo: 105,
    version: 2,
  },
]

export function buildSeedRequests(): ServiceRequest[] {
  const base = baseDate()

  return ROWS.map((row, index) => {
    const createdAt = new Date(base - row.hoursAgo * 3_600_000).toISOString()
    // A version above 1 implies the record was touched after it was created.
    const updatedAt =
      row.version > 1
        ? new Date(base - Math.max(row.hoursAgo - row.version * 2, 0) * 3_600_000).toISOString()
        : createdAt

    return {
      id: `REQ-${1001 + index}`,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      requesterName: row.requesterName,
      requesterEmail: row.requesterEmail,
      createdAt,
      updatedAt,
      version: row.version,
    }
  })
}
