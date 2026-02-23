# No Hardcoded Secrets Rule

## ⚠️ CRITICAL: Never Commit Secrets, Tokens, or Credentials

**NEVER commit secrets, API tokens, passwords, or credentials directly in code files.**

## What to Never Commit

- **API Tokens** (Jira, GitHub, AWS, etc.)
- **Passwords** (database, service accounts, etc.)
- **API Keys** (Google, Firebase, Stripe, etc.)
- **Private Keys** (SSH keys, SSL certificates, etc.)
- **Access Tokens** (OAuth tokens, session tokens, etc.)
- **Service Account Keys** (Firebase, GCP, AWS, etc.)
- **Database Connection Strings** (with passwords)
- **Encryption Keys** or **Secrets**
- **Any sensitive configuration data**

## ✅ DO: Use Environment Variables

**Always use environment variables for secrets:**

```javascript
// ✅ GOOD
const API_TOKEN = process.env.API_TOKEN;
if (!API_TOKEN) {
    throw new Error('API_TOKEN environment variable is required');
}
```

```python
# ✅ GOOD
import os
api_token = os.getenv('API_TOKEN')
if not api_token:
    raise ValueError('API_TOKEN environment variable is required')
```

```swift
// ✅ GOOD
let apiToken = ProcessInfo.processInfo.environment["API_TOKEN"]
guard let token = apiToken else {
    fatalError("API_TOKEN environment variable is required")
}
```

## ❌ DON'T: Hardcode Secrets

```javascript
// ❌ BAD - Never do this!
const API_TOKEN = 'xxx-your-secret-here-xxx';
```

```python
# ❌ BAD - Never do this!
api_token = "xxx-your-secret-here-xxx"
```

```swift
// ❌ BAD - Never do this!
let apiToken = "xxx-your-secret-here-xxx"
```

## Best Practices

### 1. Use Environment Variables

- Store secrets in environment variables
- Use `.env` files for local development (and gitignore them!)
- Use `.env.example` files as templates (without real values)
- Document required environment variables in README files

### 2. Configuration Files

- Use configuration files that are gitignored (e.g., `.env`, `config.local.json`)
- Commit example/template files (e.g., `.env.example`, `config.example.json`)
- Never commit actual configuration files with secrets

### 3. Secrets Management

- For production: Use secrets management services (AWS Secrets Manager, GCP Secret Manager, etc.)
- For CI/CD: Use encrypted secrets in GitHub Actions, GitLab CI, etc.
- For local development: Use `.env` files (gitignored)

### 4. Code Review Checklist

Before committing, check:
- [ ] No hardcoded API tokens or keys
- [ ] No hardcoded passwords
- [ ] No hardcoded connection strings with credentials
- [ ] All secrets use environment variables
- [ ] `.env` files are in `.gitignore`
- [ ] Example/template files are provided (`.env.example`)

## Examples by File Type

### Node.js / JavaScript

```javascript
// ✅ GOOD
const config = {
    apiToken: process.env.API_TOKEN,
    apiUrl: process.env.API_URL || 'https://api.example.com'
};

if (!config.apiToken) {
    throw new Error('API_TOKEN environment variable is required');
}
```

### Python

```python
# ✅ GOOD
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

API_TOKEN = os.getenv('API_TOKEN')
if not API_TOKEN:
    raise ValueError('API_TOKEN environment variable is required')
```

### Swift / iOS

```swift
// ✅ GOOD
let apiToken = ProcessInfo.processInfo.environment["API_TOKEN"]
guard let token = apiToken, !token.isEmpty else {
    fatalError("API_TOKEN environment variable is required")
}
```

### Shell Scripts

```bash
# ✅ GOOD
if [ -z "$API_TOKEN" ]; then
    echo "Error: API_TOKEN environment variable is required"
    exit 1
fi
```

## .gitignore Patterns

Ensure these patterns are in `.gitignore`:

```
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.development
*.env

# But allow example files
!.env.example

# Secrets and keys
*secret*.json
*key*.json
*credential*.json
*firebase-adminsdk*.json
GoogleService-Info.plist
google-services.json
*.pem
*.key
*.p12
*.keystore
!debug.keystore
```

## What to Do If You Accidentally Commit a Secret

1. **Immediately revoke/rotate the secret**:
   - Generate a new token/key
   - Revoke the old one in the service

2. **Remove from git history** (if not pushed):
   ```bash
   git reset --soft HEAD~1  # Remove last commit
   # Fix the file
   git commit -m "Fixed: removed hardcoded secret"
   ```

3. **If already pushed**:
   - Rotate the secret immediately
   - Use `git filter-branch` or BFG Repo-Cleaner to remove from history
   - Force push (coordinate with team first!)

4. **Document the incident**:
   - Note what was exposed
   - Document the rotation
   - Update processes to prevent recurrence

## Pre-Commit Checks

Consider adding pre-commit hooks to detect secrets:

```bash
# Example: Check for common secret patterns
git diff --cached | grep -E "(password|token|secret|key)\s*=\s*['\"][^'\"]+['\"]" && {
    echo "❌ Error: Potential hardcoded secret detected!"
    echo "   Please use environment variables instead."
    exit 1
}
```

## Tools for Secret Detection

- **git-secrets** - Prevents committing secrets
- **truffleHog** - Scans git history for secrets
- **gitleaks** - Detects hardcoded secrets
- **GitHub Secret Scanning** - Automatically scans repositories

## Related Rules

- See `.gitignore` for patterns to ignore
- See `docs/rules/jira-ticket-management.md` for Jira-specific examples
- See project README files for environment variable documentation

## Remember

**When in doubt, use environment variables. Never hardcode secrets.**

