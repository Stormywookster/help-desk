export {
  ACTIVE_STATUSES,
  AUTO_CLOSE_CRON,
  DISPLAY_TIMEZONE,
  LIMITS,
  PRIORITIES,
  STATUSES,
  TERMINAL_STATUSES,
  autoCloseDueAt,
  formatAutoCloseEt,
  isValidReopenWindow,
  ticketScopeFor,
  transition,
} from "./domain.js";

export type {
  Actor,
  AttentionEffect,
  ClearReason,
  Command,
  Priority,
  ProblemCode,
  SetReason,
  Status,
  Ticket,
  TransitionContext,
  TransitionDenial,
  TransitionOk,
  TransitionResult,
} from "./domain.js";

export {
  REFERENCE_ALPHABET,
  REFERENCE_PATTERN,
  generateReference,
} from "./reference.js";

export {
  PASSWORD_FLOWS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  checkPassword,
  passwordHelper,
  passwordPolicy,
} from "./password.js";

export type { PasswordDecision, PasswordFlow } from "./password.js";

export { formatEventTimeEt } from "./time.js";

export { isValidEmail, normalizeEmail } from "./email.js";

export {
  BRANDING_ENV_KEYS,
  BRANDING_SETTING_KEYS,
  BRAND_COLOR_PATTERN,
  LOGO_FORMATS,
  LOGO_MAX_BYTES,
  PORTAL_URL_ENV_KEY,
} from "./branding.js";

export { COPY_SCREEN_IDS, copyCatalog } from "./copy/catalog.js";

export type { CopyScreenId } from "./copy/catalog.js";

export {
  ATTACHMENT_ADMIN_MAX_FILES,
  ATTACHMENT_ADMIN_MIN_BYTES,
  ATTACHMENT_DEFAULT_MAX_BYTES,
  ATTACHMENT_DEFAULT_MAX_FILES,
  ATTACHMENT_HARD_MAX_BYTES,
  FIELD_LIMITS,
  IMPACT_OPTIONS,
  PRIORITY_LABELS,
  PROXY_BODY_MAX_BYTES,
  assignTicketBodySchema,
  attachmentSettingsSchema,
  brandColorSchema,
  changePasswordBodySchema,
  correctCustomerEmailBodySchema,
  createUserBodySchema,
  customerCancelBodySchema,
  customerMessageBodySchema,
  customerReopenBodySchema,
  emailSchema,
  hardDeleteBodySchema,
  idempotencyKeySchema,
  impactSchema,
  loginBodySchema,
  pageQuerySchema,
  patchTicketBodySchema,
  prioritySchema,
  privacyEraseBodySchema,
  privacyExportBodySchema,
  productBodySchema,
  publicAccessBodySchema,
  publicLookupBodySchema,
  publicResendBodySchema,
  publicTicketFieldsSchema,
  referenceSchema,
  reopenWindowDaysSchema,
  resetPasswordBodySchema,
  secureLinkTokenSchema,
  senderBodySchema,
  setupAdminBodySchema,
  siteNameSchema,
  staffMessageBodySchema,
  updateProductBodySchema,
  updateUserBodySchema,
  uploadLimit,
} from "./schemas.js";

export type { UploadLimit, UploadLimitKind } from "./schemas.js";
