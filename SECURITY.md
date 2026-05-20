# Security Policy

OpenCub is a local-first coding agent that can read files, execute shell
commands, call git, and connect to model providers. Security reports need to be
handled privately so users have time to upgrade before details are public.

## Supported Versions

Only the latest released version of `opencub` is supported for security fixes.
If a supported fix requires a broader compatibility change, maintainers may
publish a patch release and document the affected versions in the advisory.

## Reporting a Vulnerability

Do not open a public GitHub issue for vulnerabilities.

Use GitHub's private vulnerability reporting flow for this repository:

https://github.com/BitopiaLabs/Opencub/security/advisories/new

If private reporting is unavailable, open a minimal public issue asking for a
maintainer contact path. Do not include exploit details, secrets, tokens,
private logs, or repro steps in that public issue.

Helpful reports include:

- Affected OpenCub version and install method
- Operating system and Node.js version
- Provider/runtime involved, if relevant
- Minimal reproduction steps
- Impact assessment and any known workarounds
- Logs or screenshots with secrets and personal data removed

## Response Expectations

Maintainers will aim to acknowledge valid reports within 3 business days. After
triage, the maintainers will coordinate remediation, release timing, and public
disclosure through the advisory thread.

## Security Boundaries

OpenCub intentionally provides powerful local automation. The following are not
security vulnerabilities by themselves:

- The agent reading or editing files after the user grants access in a trusted
  workspace
- Shell commands run under an explicitly approved or auto-accepted execution
  mode
- Model output that suggests unsafe code or commands without OpenCub bypassing
  its configured approval policy
- Provider-side behavior outside OpenCub's control

Reports are still welcome when OpenCub bypasses a documented approval boundary,
exposes credentials, writes outside the intended workspace, mishandles
untrusted input, or enables command execution without the configured consent.
