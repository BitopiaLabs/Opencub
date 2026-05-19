---
title: "Logging"
description: "Structured logging configuration with Pino"
sidebar_order: 5
---

# Logging Configuration

OpenCub includes structured logging with Pino, providing correlation tracking, performance monitoring, and automatic PII redaction.

## Quick Start

```bash
# Environment Variables
OPENCUB_LOG_LEVEL=debug          # Log level (trace, debug, info, warn, error, fatal)
OPENCUB_LOG_DIR=/var/log/opencub # Log directory override
OPENCUB_CORRELATION_ENABLED=true  # Enable correlation tracking
```

## Features

- Structured JSON logging with metadata support
- Correlation tracking across components
- Automatic PII detection and redaction
- Performance monitoring and metrics

## Default Log File Locations

Logs are always written to file. The default locations are platform-specific:

- **macOS**: `~/Library/Logs/opencub`
- **Linux/Unix**: `~/.local/state/opencub/logs` (or `$XDG_STATE_HOME/opencub/logs`)
- **Windows**: `%LOCALAPPDATA%/opencub/logs`

You can override the default location using the `OPENCUB_LOG_DIR` environment variable.

To disable file logging entirely, set `OPENCUB_LOG_DISABLE_FILE=true`.

## Configuration Examples

**Development:**
```bash
OPENCUB_LOG_LEVEL=debug
OPENCUB_CORRELATION_ENABLED=true
OPENCUB_CORRELATION_DEBUG=true
```

**Production:**
```bash
OPENCUB_LOG_LEVEL=info
OPENCUB_LOG_DIR=/var/log/opencub
OPENCUB_CORRELATION_ENABLED=true
OPENCUB_CORRELATION_DEBUG=false
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCUB_LOG_LEVEL` | Log level (trace, debug, info, warn, error, fatal) | `info` |
| `OPENCUB_LOG_TO_FILE` | Enable file logging | `true` |
| `OPENCUB_LOG_DIR` | Log directory override | Platform default |
| `OPENCUB_LOG_DISABLE_FILE` | Disable file logging entirely | `false` |
| `OPENCUB_CORRELATION_DEBUG` | Debug correlation tracking | `false` |
| `OPENCUB_CORRELATION_ENABLED` | Enable correlation tracking | `true` |

## Key Capabilities

### Correlation Tracking

Unique correlation IDs are generated for request tracking across components. This enables cross-component request correlation with metadata support and async context preservation using `AsyncLocalStorage`.

### Security & Data Protection

Automatic detection and redaction of sensitive data including emails, phone numbers, SSNs, credit cards, API keys, passwords, and tokens.

### Performance Monitoring

Function execution time tracking, memory usage monitoring, CPU usage tracking, and configurable performance threshold alerts.

### Request Tracking

HTTP request timing, AI provider call tracking, MCP server operation monitoring, and error rate monitoring.

## Usage Examples

### Basic Logging

```typescript
import {getLogger} from '@/utils/logging';

const logger = getLogger();

logger.fatal('Critical system failure');
logger.error('Operation failed', {error: new Error('Test error')});
logger.warn('Resource limit approaching');
logger.info('Application started successfully');
logger.debug('Debug information', {details: 'verbose'});
logger.trace('Detailed trace information');
```

### Structured Logging

```typescript
logger.info('User login successful', {
    userId: 'user-123',
    sessionId: 'session-456',
    authenticationMethod: 'oauth2',
    timestamp: new Date().toISOString()
});
```

### Correlation Context

```typescript
import {withNewCorrelationContext, getCorrelationId} from '@/utils/logging';

await withNewCorrelationContext(async (context) => {
    const correlationId = getCorrelationId();
    logger.info('Operation started', {correlationId});

    // All logs within this context share the same correlation ID
    logger.debug('Processing step 1');
    logger.debug('Processing step 2');
}, 'parent-correlation-id', {userId: 'user-123'});
```

## Troubleshooting

### Logs not appearing

- Check `OPENCUB_LOG_LEVEL` allows your messages through (e.g. `debug` level won't show with `info` level set)
- Verify the log directory exists and is writable
- Check `OPENCUB_LOG_DISABLE_FILE` is not set to `true`

### Performance degradation with logging

- Reduce log level in production to `info` or `warn`
- Disable correlation tracking for high-volume operations

### Sensitive data in logs

- The automatic redaction system handles common patterns
- Add custom redaction rules for application-specific fields
