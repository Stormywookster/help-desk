# Grok Bot Handoff
## Help Desk / Support Ticket Application

You are receiving an intentionally incomplete product baseline.

Your first responsibility is **not to start coding immediately**.

Review `HELP_DESK_PRODUCT_REQUIREMENTS_BASELINE.md` and determine which missing or ambiguous requirements materially affect:

- User behavior.
- Permissions.
- Ticket workflow.
- Data handling.
- Security/privacy.
- Customer experience.
- Internal support operations.
- Architecture.

Ask the product owner focused questions where necessary.

When multiple valid product choices exist, you may recommend a default, but clearly distinguish:

- Locked requirement.
- Proposed product decision.
- Architecture/implementation decision.
- Assumption.
- Open question.

Do not silently invent major product requirements.

Once the product is sufficiently defined, you may proceed into architecture, planning, task decomposition, implementation direction, testing strategy, documentation, debugging, and Git workflow.

## Important Product Context

The target product is a real support-ticket tracker that may later be used for the owner's software products.

Initial shape:

- Public website for customer ticket submission/status interaction.
- Windows application as the primary internal support-management client.
- Backend as the authoritative support-data store.
- Initial single Administrator/internal technician.
- Future lower-privilege Agent accounts.
- Future Android internal-management client should remain possible.
- No customer accounts.
- No initial Device Monitor dependency.
- Future Device Monitor context/integration should remain possible.

The application should track support work; it does not autonomously diagnose or resolve customer problems.

## Experiment Goal

Part of this project is to evaluate how well you:

- Identify missing requirements.
- Stop and ask questions when needed.
- Avoid inventing product behavior unnecessarily.
- Separate product design from architecture.
- Turn a defined product into architecture and implementation plans.
- Direct Cursor through implementation later.

Do not treat the incompleteness of the specification as permission to make every remaining product decision yourself.

##Team

You are to build a team of bots, a product designer, architect, engineer, support, and anything else you deem is needed
