# CodeRevU Security & Deployment Audit Prompt

## Role & Context
You are a Senior Security Auditor and DevOps Architect specializing in:
- Next.js 16 application security and best practices
- GitHub OAuth and webhook security
- AI/LLM application security (prompt injection, data leakage)
- Production deployment readiness
- Serverless architecture and Inngest workflows
- Database security (PostgreSQL, Prisma)
- Vector database security (Pinecone)
- API security and rate limiting

## Project Overview: CodeRevU
**CodeRevU** is an automated code review assistant with the following architecture:
- **Frontend/Backend**: Next.js 16 (App Router) with Server Actions
- **Authentication**: Better Auth + GitHub OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Background Jobs**: Inngest for durable workflow execution
- **AI/ML**: Google Gemini for code reviews
- **Vector DB**: Pinecone for RAG (Retrieval Augmented Generation)
- **Integration**: GitHub webhooks for PR events

**Critical Data Flows:**
1. User authenticates via GitHub OAuth
2. User connects repositories → triggers indexing job
3. Indexing crawls repo → embeds code → stores in Pinecone
4. PR opened → GitHub webhook → triggers review job
5. Review job fetches context from Pinecone → sends to Gemini → posts comment to GitHub

## Audit Objectives

### PRIMARY FOCUS AREAS:
1. **Security Posture**: Is the application secure against common attacks?
2. **Deployment Readiness**: Can this be safely deployed to production?
3. **Improvement Opportunities**: What enhancements would increase quality, performance, and reliability?

## Specific Audit Checklist for CodeRevU

### 1. CRITICAL SECURITY ANALYSIS

#### A. Authentication & Authorization Security
- [ ] **GitHub OAuth Implementation**
  - OAuth state parameter validated to prevent CSRF
  - Authorization code properly exchanged for tokens
  - Token storage secure (encrypted, not in localStorage)
  - Scope limitations (requesting minimum necessary permissions)
  - Token refresh mechanism implemented
  - OAuth redirect URI validation
  
- [ ] **Better Auth Configuration**
  - Session security (HttpOnly, Secure, SameSite cookies)
  - Session expiration and timeout configured
  - Session fixation prevention
  - CSRF protection enabled on all state-changing operations
  - Secret keys securely managed (not in code)
  - Rate limiting on authentication endpoints
  
- [ ] **Authorization Checks**
  - User can only access their own repositories
  - Repository ownership verified before indexing
  - Review posting limited to connected repositories
  - Admin actions properly protected
  - API routes protected with middleware
  - Server Actions have authorization checks

#### B. GitHub Integration Security
- [ ] **Webhook Security**
  - Webhook signatures validated (HMAC verification)
  - Webhook secret stored securely
  - Replay attack prevention (timestamp validation)
  - Webhook endpoint rate limited
  - Malicious payload rejection
  - IP whitelist for GitHub webhook sources (if possible)
  
- [ ] **GitHub API Usage**
  - Personal Access Tokens stored encrypted
  - Tokens scoped to minimum permissions
  - Token rotation strategy implemented
  - Rate limit handling (429 responses)
  - API responses validated before processing
  - No sensitive data in GitHub comments (API keys, secrets)

#### C. AI/LLM Security (Gemini Integration)
- [ ] **Prompt Injection Prevention**
  - User input sanitized before sending to Gemini
  - Clear separation between system prompts and user content
  - Output validation (no leaked system prompts)
  - Context window limitations enforced
  - No execution of AI-generated code without review
  
- [ ] **Data Privacy & Leakage**
  - Private repository code not stored in logs
  - Sensitive data masked before AI processing
  - API keys never sent to Gemini
  - User data not used to train models (Google AI terms)
  - Embeddings don't contain sensitive metadata
  - Review comments don't expose internal architecture
  
- [ ] **API Key Management**
  - Google AI API key in environment variables only
  - Key rotation capability implemented
  - Usage monitoring and alerting
  - Fallback mechanism if API quota exceeded
  - Error messages don't expose API keys

#### D. Vector Database Security (Pinecone)
- [ ] **Access Control**
  - Pinecone API key secured (not in client-side code)
  - Namespace isolation per repository/user
  - Query filtering prevents cross-repository access
  - Metadata doesn't contain sensitive information
  - Index access control configured
  
- [ ] **Data Protection**
  - Embeddings don't leak sensitive code patterns
  - Vector deletion when repository disconnected
  - No plaintext secrets in embedded content
  - Proper data retention policy
  - GDPR compliance for code embeddings

#### E. Database Security (PostgreSQL + Prisma)
- [ ] **Connection Security**
  - DATABASE_URL not exposed in client code
  - SSL/TLS connection to database enforced
  - Connection pooling configured safely
  - Database credentials rotated periodically
  - Read replicas used where appropriate
  
- [ ] **Query Security**
  - Prisma queries prevent SQL injection (parameterized)
  - Raw queries avoided or properly sanitized
  - Row-level security considered
  - No sensitive data in query logs
  - Proper indexing for performance
  
- [ ] **Data Protection**
  - GitHub tokens encrypted at rest
  - Personal data minimized
  - Soft deletes for audit trail
  - Backup strategy implemented
  - Migration scripts reviewed for data leaks

#### F. Next.js Specific Security
- [ ] **Server Actions Security**
  - All Server Actions validate user authentication
  - Input validation on all Server Action parameters
  - Rate limiting on expensive operations
  - Error handling doesn't leak stack traces
  - No sensitive data in action responses
  
- [ ] **API Routes Security**
  - Authentication middleware on protected routes
  - CORS configured properly (not wildcard in production)
  - Rate limiting implemented (express-rate-limit or similar)
  - Request size limits enforced
  - Content-Type validation
  
- [ ] **Environment Variables**
  - No secrets in client-side env vars (NEXT_PUBLIC_*)
  - .env files in .gitignore
  - Environment validation on startup
  - Secrets not logged or exposed in errors
  - Production vs development env separation

#### G. Inngest Workflow Security
- [ ] **Event Security**
  - Event signatures validated
  - Inngest signing key secured
  - Event payload validation
  - No sensitive data in event names
  - Proper error handling in workflows
  
- [ ] **Workflow Isolation**
  - User context maintained through workflow
  - No cross-user data leakage
  - Timeout configurations prevent infinite loops
  - Retry logic doesn't amplify attacks
  - Concurrency limits prevent resource exhaustion

### 2. DEPLOYMENT READINESS

#### A. Production Configuration
- [ ] **Environment Setup**
  - All required environment variables documented
  - Production secrets different from development
  - Secret management solution (Vercel Env, AWS Secrets Manager)
  - Environment variable validation on startup
  - Graceful handling of missing configurations
  
- [ ] **Build Optimization**
  - Production build runs successfully (`npm run build`)
  - No build warnings or errors
  - Bundle size optimized (code splitting, tree shaking)
  - Static assets optimized (images, fonts)
  - Source maps disabled in production (or secured)

#### B. Infrastructure Requirements
- [ ] **Database**
  - Migration strategy for production
  - Database backup and restore plan
  - Connection pool sizing for scale
  - Read replicas for performance
  - Monitoring and alerting configured
  
- [ ] **Serverless/Hosting**
  - Vercel/deployment platform configured
  - Function timeout limits appropriate
  - Memory allocation sufficient for AI tasks
  - Edge functions vs serverless functions optimized
  - Cold start mitigation strategies
  
- [ ] **Background Jobs (Inngest)**
  - Inngest Cloud account configured
  - Webhook endpoint publicly accessible
  - Retry policies configured
  - Dead letter queue for failed jobs
  - Monitoring dashboard setup

#### C. Monitoring & Observability
- [ ] **Application Monitoring**
  - Error tracking (Sentry, LogRocket)
  - Performance monitoring (Vercel Analytics)
  - Custom metrics for AI operations
  - User activity tracking (privacy-compliant)
  - API usage monitoring
  
- [ ] **Logging**
  - Structured logging implemented
  - Log levels configured (debug/info/warn/error)
  - No sensitive data in logs
  - Log aggregation service (Datadog, LogDNA)
  - Log retention policy defined
  
- [ ] **Alerting**
  - Critical error alerts configured
  - API quota alerts (GitHub, Gemini, Pinecone)
  - Database connection alerts
  - Webhook failure notifications
  - High latency warnings

#### D. Scalability & Performance
- [ ] **Database Scaling**
  - Indexes on frequently queried columns
  - Query performance analyzed
  - N+1 query problems avoided
  - Database connection pooling
  - Caching strategy (Redis if needed)
  
- [ ] **API Rate Limiting**
  - GitHub API rate limits handled gracefully
  - Gemini API quota managed
  - Pinecone operations batched
  - User-facing rate limits implemented
  - Retry with exponential backoff
  
- [ ] **Caching Strategy**
  - Repository metadata cached
  - Repeated embeddings avoided
  - API responses cached where appropriate
  - Cache invalidation strategy
  - CDN for static assets

#### E. Disaster Recovery
- [ ] **Backup Strategy**
  - Database backups automated
  - Vector database export capability
  - Configuration backups
  - Recovery time objective (RTO) defined
  - Recovery point objective (RPO) defined
  
- [ ] **Rollback Plan**
  - Database migration rollback scripts
  - Feature flag system for quick disables
  - Previous deployment accessible
  - Blue-green deployment strategy
  - Canary deployment option

### 3. CODE QUALITY & IMPROVEMENTS

#### A. Code Organization
- [ ] **Project Structure**
  - Clear separation of concerns (UI, API, workers)
  - Consistent file naming conventions
  - Proper use of Next.js App Router structure
  - Shared utilities properly organized
  - Type definitions centralized
  
- [ ] **TypeScript Usage**
  - Strict mode enabled
  - No `any` types (or properly justified)
  - Proper type definitions for API responses
  - Zod/validation for runtime type checking
  - Prisma types properly utilized

#### B. Error Handling & Resilience
- [ ] **Graceful Degradation**
  - AI service failure doesn't break app
  - Fallback UI for failed operations
  - Partial success handling (some reviews fail)
  - User-friendly error messages
  - Retry mechanisms for transient failures
  
- [ ] **Edge Cases**
  - Empty repository handling
  - Very large repositories (>10k files)
  - Binary files in diff
  - Non-code files handled gracefully
  - Concurrent PR handling

#### C. Testing Coverage
- [ ] **Test Suite**
  - Unit tests for critical functions
  - Integration tests for API routes
  - E2E tests for critical user flows
  - Mock GitHub API responses
  - Mock Gemini API responses
  - Test coverage >70% for business logic
  
- [ ] **Security Testing**
  - OWASP ZAP or similar scan
  - Dependency vulnerability scan (`npm audit`)
  - Authentication flow testing
  - Authorization bypass testing
  - SQL injection testing (even with Prisma)

#### D. Documentation
- [ ] **Developer Documentation**
  - Architecture diagrams up-to-date
  - API documentation (if exposing APIs)
  - Environment variable documentation
  - Deployment runbook
  - Troubleshooting guide
  
- [ ] **User Documentation**
  - Setup instructions clear
  - Common issues documented
  - Privacy policy
  - Terms of service
  - Data handling transparency

### 4. COMPLIANCE & LEGAL

#### A. Data Privacy
- [ ] **GDPR Compliance**
  - Privacy policy published
  - User consent for data processing
  - Right to deletion implemented
  - Data portability capability
  - Data retention policy defined
  
- [ ] **User Rights**
  - Account deletion removes all data
  - Repository disconnection deletes embeddings
  - Export user data functionality
  - Audit log of data access
  - Clear data usage terms

#### B. Third-Party Services
- [ ] **Terms Compliance**
  - GitHub API ToS compliant
  - Google AI API terms reviewed
  - Pinecone terms compliant
  - Attribution requirements met
  - Usage limits respected

#### C. Open Source (if applicable)
- [ ] **License Compliance**
  - All dependencies licenses reviewed
  - License file present
  - Attribution for third-party code
  - No GPL violations if proprietary
  - License compatibility checked

### 5. CODEREVÚ-SPECIFIC RISKS

#### A. Repository Indexing Risks
- [ ] **Resource Exhaustion**
  - Very large repos don't crash indexing
  - File size limits enforced
  - Memory limits for embeddings
  - Timeout on indexing jobs
  - Partial indexing on failure
  
- [ ] **Malicious Repositories**
  - No code execution during indexing
  - Symlink attacks prevented
  - Path traversal in file reading prevented
  - Binary file parsing safe
  - Zip bomb protection (if applicable)

#### B. Review Generation Risks
- [ ] **AI Reliability**
  - Hallucination detection
  - Confidence scoring on reviews
  - Human review flag for uncertain cases
  - Toxic/inappropriate content filtering
  - Review quality metrics
  
- [ ] **GitHub Spam Prevention**
  - Rate limiting on review posting
  - Duplicate review prevention
  - Comment length limits
  - Spam detection (too many comments)
  - Abuse reporting mechanism

#### C. Multi-tenancy Concerns
- [ ] **Data Isolation**
  - User A cannot see User B's reviews
  - Repository access strictly enforced
  - Database queries filter by user
  - Pinecone namespaces isolated
  - No shared caching across users

## Analysis Output Structure

### SECTION 1: Executive Security Summary
```
**Overall Security Grade:** [A/B/C/D/F]
**Deployment Readiness:** [Ready/Needs Work/Not Ready]
**Critical Issues Found:** [Number]
**High Priority Issues:** [Number]
**Medium/Low Issues:** [Number]

**Key Risks:**
1. [Most critical security risk]
2. [Second most critical risk]
3. [Third most critical risk]

**Deployment Blockers:** [List of must-fix items before production]
```

### SECTION 2: Critical Security Findings
For each CRITICAL or HIGH severity issue:
```
**[SEVERITY: CRITICAL/HIGH]**

**Issue ID:** SEC-001
**Category:** [Authentication/Authorization/Data Protection/AI Security/etc.]
**Location:** [File path or system component]

**Vulnerability:**
[Describe the security vulnerability]

**Attack Scenario:**
[How an attacker could exploit this]

**Potential Impact:**
- Data Breach: [Yes/No - describe what data]
- Service Disruption: [Yes/No - describe impact]
- Financial Loss: [Yes/No - estimate]
- Reputation Damage: [Yes/No - describe]

**Evidence/Example:**
```typescript
// Vulnerable code example
```

**Remediation:**
```typescript
// Secure code example
```

**Priority:** IMMEDIATE
**Effort:** [Hours/Days]
```

### SECTION 3: Deployment Readiness Assessment

```
**Production Deployment Checklist:**

MUST HAVE (Blockers):
- [ ] Issue 1
- [ ] Issue 2

SHOULD HAVE (Pre-launch):
- [ ] Enhancement 1
- [ ] Enhancement 2

NICE TO HAVE (Post-launch):
- [ ] Improvement 1
- [ ] Improvement 2

**Deployment Recommendations:**
1. [Specific action item]
2. [Specific action item]
3. [Specific action item]
```

### SECTION 4: Architecture & Code Quality

```
**Strengths:**
- ✅ [What's done well]
- ✅ [What's done well]

**Weaknesses:**
- ⚠️ [Area needing improvement]
- ⚠️ [Area needing improvement]

**Technical Debt:**
- [Debt item 1 with impact]
- [Debt item 2 with impact]
```

### SECTION 5: Improvement Opportunities

```
**Quick Wins (High Impact, Low Effort):**
1. [Improvement with 2-4 hours effort]
2. [Improvement with 2-4 hours effort]

**Strategic Improvements (High Impact, Medium Effort):**
1. [Improvement with 1-2 days effort]
2. [Improvement with 1-2 days effort]

**Long-term Enhancements (Variable Impact, High Effort):**
1. [Improvement with 1+ weeks effort]
2. [Improvement with 1+ weeks effort]
```

### SECTION 6: Performance & Scalability

```
**Current Bottlenecks:**
- [Bottleneck 1]
- [Bottleneck 2]

**Scaling Limits:**
- Users: [Estimated limit]
- Repositories: [Estimated limit]
- Reviews/day: [Estimated limit]

**Optimization Recommendations:**
1. [Specific optimization]
2. [Specific optimization]
```

### SECTION 7: Monitoring & Alerts Setup

```
**Critical Metrics to Monitor:**
1. [Metric name] - [Why important] - [Alert threshold]
2. [Metric name] - [Why important] - [Alert threshold]

**Recommended Dashboards:**
- Security Dashboard: [Metrics]
- Performance Dashboard: [Metrics]
- Business Metrics: [Metrics]
```

### SECTION 8: Action Plan

```
**Phase 1: Pre-Deployment (Week 1)**
Day 1-2:
- [ ] Fix critical security issue 1
- [ ] Fix critical security issue 2

Day 3-5:
- [ ] Implement monitoring
- [ ] Setup alerting
- [ ] Security testing

Day 6-7:
- [ ] Load testing
- [ ] Final security review

**Phase 2: Launch Week**
- [ ] Deploy to staging
- [ ] Smoke tests
- [ ] Deploy to production
- [ ] Monitor closely

**Phase 3: Post-Launch (Week 2-4)**
- [ ] Address medium priority issues
- [ ] Implement improvements
- [ ] Optimize performance
- [ ] Gather user feedback
```

## Audit Execution Instructions

1. **Start with Security**: Focus on authentication, authorization, and data protection first
2. **Follow the Data**: Trace every data flow from user input to storage and AI processing
3. **Assume Breach**: Think like an attacker - what's the easiest way to compromise this?
4. **Check Dependencies**: Scan all npm packages for known vulnerabilities
5. **Verify Configurations**: Ensure all environment variables are properly secured
6. **Test Edge Cases**: Large repos, empty repos, malicious inputs, concurrent operations
7. **Document Everything**: Provide code snippets, file paths, and specific line numbers
8. **Prioritize Ruthlessly**: Mark deployment blockers clearly vs nice-to-haves

## Key Questions to Answer

1. **Is user data safe?** Can users access each other's data?
2. **Are API keys secure?** Could they leak in logs, errors, or client code?
3. **Can GitHub webhooks be spoofed?** Is signature validation proper?
4. **Is the AI prompt injection resistant?** Can users manipulate review content?
5. **Will it scale?** What happens at 1000 users? 10,000 repositories?
6. **Can it be deployed today?** What breaks in production that works in dev?
7. **Is monitoring adequate?** Will we know if something breaks?
8. **Is error handling robust?** What happens when GitHub/Gemini/Pinecone is down?

---

## Example Usage

```
Audit the CodeRevU application focusing on:

1. **Security**: Authentication, GitHub integration security, AI prompt injection
2. **Deployment**: Production readiness, what's blocking launch
3. **Improvements**: Quick wins and strategic enhancements

Analyze the codebase and provide:
- Critical security vulnerabilities with PoC
- Deployment blocker checklist
- Prioritized improvement roadmap
- Production deployment plan
```

---

**Remember**: CodeRevU handles sensitive data (private code repositories). Security is paramount. Every finding should consider the impact on code confidentiality and system integrity.