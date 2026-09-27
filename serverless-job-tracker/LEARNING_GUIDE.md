1. Browser: authenticated `POST /upload-url` with `{ filename, contentType }`.
# Learning Guide: Serverless Job Application Tracker

Read this top to bottom once, then keep it next to you while you explore
the code. The goal is that you can explain every box in the architecture
diagram and answer "why did you build it this way?" without notes.

---

## 1. The big picture

The app has four connected parts:

1. **Frontend** - React and Amplify Auth handle email sign-up, verification,
  sign-in, and sign-out. API calls carry a Cognito ID token.
2. **Identity** - Cognito issues JWTs; API Gateway validates them before
  invoking a Lambda.
3. **API + business logic** - six small Lambda functions handle create, list,
  get, update, delete, and resume upload URL requests.
4. **Storage** - DynamoDB stores owner-scoped application records; S3 stores
  resumes under per-user prefixes.

Nothing here runs on a server you manage. AWS runs each piece per-request,
scales it automatically, and bills per use.

## 2. Request flow, step by step

### Reading the list (GET /applications)

1. Amplify attaches the current ID token in the `Authorization: Bearer ...`
  header to `GET /applications`.
2. API Gateway validates the token signature, issuer, audience, and expiry.
  Missing or invalid tokens are rejected before Lambda runs.
3. `ListApplicationsFunction` reads the verified `sub` claim and runs a
  `QueryCommand` against `UserIdCreatedAtIndex`, partitioned by that user ID
  and ordered newest first.
4. API Gateway returns that user's items and the React app re-renders.

### Creating an application (POST /applications)

Same path, but the Lambda first validates the JSON body
(`src/lib/validate.ts`). Bad input returns 400 without touching the
database. The Lambda takes `userId` from the verified token's `sub`, never
from the request body. Good input gets a UUID and timestamps and is written
with `PutCommand`, then returned with status 201.

### Updating (PUT /applications/{id})

The handler builds a DynamoDB `UpdateExpression` containing only the fields
the client sent, plus a fresh `updatedAt`. It also requires the stored
`userId` to match the verified token. Two details worth knowing:

- `ConditionExpression` requires an existing `id` and matching `userId`. A
  missing or foreign-owned id returns 404 without revealing ownership.
- `ReturnValues: ALL_NEW` makes DynamoDB return the full updated item, which
  we hand back to the client.

### Resume upload (the interesting one)

Uploading a file through Lambda would work, but Lambda's request payload
limit is 6 MB and you would pay for the Lambda time spent proxying bytes.
Instead:

1. Browser: `POST /upload-url` with `{ filename, contentType }`.
2. Lambda validates the type (PDF/DOC/DOCX only), reads `userId` from the
  JWT, builds a safe key like `uploads/<userId>/<uuid>-resume.pdf`, and asks
  S3 for a **presigned PUT URL** that authorizes that object for 5 minutes.
3. Browser PUTs the file bytes directly to S3 using that URL. Lambda is done
   after step 2 - it never sees the file.
4. The browser then saves the S3 key onto the application record via the
  normal update endpoint, which accepts only keys under the caller's prefix.

The bucket itself is fully private; the presigned URL is the only door in.

## 3. Why each technology was chosen

### Why serverless at all?

For a personal app with bursty, low traffic, servers are wasted money and
ops work. Serverless: no patching, no idle cost, automatic scaling. It is
also the stack a huge number of companies (including the ones you are
applying to) build on, so it interviews well.

### Why AWS Lambda?

- Runs code on demand, billed per millisecond.
- Each endpoint is its own small function - easy to reason about, easy to
  test, independent scaling and IAM permissions.
- Tradeoff: **cold starts** (see Q3 below) and you cannot hold in-memory
  state between requests.

### Why API Gateway HTTP API (not REST API)?

API Gateway has two flavors. HTTP API is the newer one: roughly 70%
cheaper, lower latency, and simpler. REST API adds features you would only
need in bigger systems (API keys, request transformation, caching). For a
JSON CRUD API, HTTP API is the right default.

### Why Amazon Cognito?

Cognito handles email signup, verification, password storage, and token
issuance. Amplify Auth manages the browser session. API Gateway validates the
JWT against the User Pool issuer and app-client audience, then passes its
verified claims to Lambda. The backend uses only `sub` from those claims for
ownership; a request body cannot choose another user's identity.

### Why DynamoDB (not RDS/Postgres)?

- No server to manage, scales to any size, single-digit-millisecond reads.
- The table primary key fetches by application `id`; a GSI partitioned by
  `userId` and sorted by `createdAt` serves each user's list query.
- Tradeoff: no joins, no flexible ad-hoc queries. If you later need "all
  companies where I had 2+ interviews and applied via referral", DynamoDB
  gets awkward. You design the table around known access patterns.

### Why S3 presigned URLs?

- Keeps big binary payloads out of Lambda (6 MB limit, billed duration).
- The bucket stays private; the presigned URL is a short-lived, single-
  purpose permission slip.
- This pattern is used everywhere in industry - worth being fluent in it.

### Why AWS SAM?

SAM is CloudFormation with shorthand for serverless resources. One
`template.yaml` describes the API, functions, table, bucket, and their IAM
permissions, so the whole system is reproducible and reviewable in git.

- **SAM vs raw CloudFormation**: SAM expands `AWS::Serverless::Function`
  into the function + log group + permissions automatically.
- **SAM vs Terraform**: Terraform is cloud-agnostic and very common in
  industry; SAM is AWS-only but tighter for Lambda/API Gateway (local
  testing with `sam local`, simpler policy templates). Knowing one IaC tool
  deeply transfers well to the others.
- **SAM vs CDK**: CDK lets you write infra in TypeScript/Python and
  generates CloudFormation. More powerful, more abstraction. SAM is easier
  to read as a beginner.

### Why Vite + React + TypeScript?

- Vite is the current standard for new React apps: near-instant dev server,
  simple config, fast builds. (Create React App is deprecated.)
- TypeScript catches an entire class of bugs at build time and makes the
  API shapes (`JobApplication`) self-documenting. Interviewers expect it.

### Why Jest + aws-sdk-client-mock?

Unit tests run without any AWS account: the mock intercepts SDK calls at
the client boundary, so you test your validation, branching, and error
handling logic, not AWS itself. That is the correct unit-test boundary.

## 4. Problems you will hit and how this code handles them

- **CORS**: browsers block cross-origin fetch unless the API opts in. The
  HTTP API answers preflight OPTIONS requests itself (declared in the SAM
  template); `Authorization` is allowed for bearer-token requests.
- **Partial updates**: building `UpdateExpression` from only the provided
  fields means a status change cannot accidentally erase notes.
- **Path traversal in filenames**: `getUploadUrl` strips any path prefix
  and whitelists characters before building the S3 key.
- **Updating/deleting nonexistent ids**: `ConditionExpression:
  attribute_exists(id) AND userId = :userId` converts nonexistent and
  foreign-owned writes into a clean 404.
- **Secrets**: there are none in the code. AWS SDK calls inside Lambda
  authenticate via the function's IAM role automatically.

## 5. What is NOT production-grade (be honest in interviews)

- Pre-Cognito legacy records have no `userId` and are not returned to signed-in
  users until explicitly migrated.
- List results do not yet expose pagination for very large histories.
- No rate limiting, CloudWatch alarms, or DLQ.
- CORS is wide open (`*`).
- Frontend is a single page with minimal state management.

Being able to name these unprompted is a strong interview signal.

---

## 6. Interview questions and answers

**Q1. Walk me through the architecture of this project.**
A: React and Amplify Auth use Cognito for email sign-up/sign-in. The browser
sends an ID token to an API Gateway HTTP API with a JWT authorizer. Six Lambda
functions handle CRUD and presigned uploads; DynamoDB access is scoped to the
token's `sub`, and S3 keys are per-user. SAM defines the infrastructure.

**Q2. Why did you choose serverless instead of, say, a Node/Express server?**
A: Traffic is tiny and bursty, so per-request billing is basically free,
and there is nothing to patch or keep alive. I also wanted independent
scaling and least-privilege IAM per endpoint. The tradeoff is cold starts
and no in-memory state, which don't matter for this workload.

**Q3. What is a cold start and how do you reduce it?**
A: When Lambda has no warm container, AWS must provision one and load your
code before running it - typically a few hundred ms for Node. Mitigations:
keep the deployment package small, reuse SDK clients outside the handler
(this code does), use provisioned concurrency for latency-critical
functions, or pick a faster-starting runtime.

**Q4. Why DynamoDB over a relational database?**
A: The table primary key fetches an item by id; a GSI partitioned by `userId`
and sorted by `createdAt` supports a user's list. DynamoDB provides managed,
scalable storage with no connection management, which pairs well with Lambda.
If I needed joins or ad-hoc analytics I would pick Postgres.

**Q5. How does DynamoDB scale, and why is the partition key important?**
A: The base table partitions on random application IDs. The list GSI
partitions on Cognito `userId` and sorts on `createdAt`, making the access
pattern explicit. A very high-traffic single user could create a hot GSI
partition, but this personal tracker does not have that load profile.

**Q6. Explain the resume upload flow. Why not upload through your API?**
A: The client asks the API for a presigned URL; Lambda signs a PUT for one
specific S3 key, valid 5 minutes; the browser uploads straight to S3.
Through-Lambda would hit the 6 MB payload limit and bill Lambda for
proxying bytes. Presigning keeps the bucket private while avoiding both.

**Q7. What is CORS and where did you handle it?**
A: Browsers enforce the same-origin policy; a page on one origin cannot
read responses from another unless the server sends
Access-Control-Allow-* headers. Preflight OPTIONS requests are answered by
API Gateway via the template's CorsConfiguration, and actual responses get
the headers from a shared response helper.

**Q8. SAM vs Terraform - when would you pick each?**
A: SAM is AWS-native with terse serverless syntax and local testing; great
for Lambda-centric apps. Terraform is multi-cloud with a huge provider
ecosystem and strong state management; the default for heterogeneous
infrastructure. This project is AWS-only and serverless, so SAM keeps the
template small and readable.

**Q9. How does your CI pipeline work?**
A: Two GitHub Actions jobs on every push and PR. Backend: npm ci,
TypeScript typecheck, Jest unit tests with the AWS SDK mocked, and
`sam validate --lint`. Frontend: npm ci and a full production build, which
also typechecks. A broken build blocks merging.

**Q10. How do you handle errors and retries in Lambda?**
A: Handlers catch and map errors: validation to 400, conditional-check
failures to 404, unexpected errors to 500 with the detail logged to
CloudWatch. API Gateway-to-Lambda synchronous invokes are not auto-retried;
the client can safely retry idempotent methods like GET and PUT. For async
invokes Lambda retries twice and can send failures to a DLQ - that is what
I would add next.

**Q11. How does authentication work here?**
A: Amplify Auth signs up with email and password, confirms the email code,
and signs in through Cognito. Amplify attaches the current ID token to API
requests. The HTTP API validates it; handlers use the verified `sub` claim
for ownership and never trust a body-supplied user ID.

**Q12. How do your tests work without an AWS account?**
A: aws-sdk-client-mock intercepts calls at the SDK client boundary, so I
can script DynamoDB/S3 responses and failures and assert on the exact
commands sent. That tests my logic - validation, expression building,
error mapping - which is the unit I own. Against real AWS I would add a
small integration test suite run in a dev account.

**Q13. How is the S3 bucket secured?**
A: All public access is blocked; writes use short-lived presigned URLs from
a Lambda role limited to the bucket. File types are restricted to
PDF/DOC/DOCX, and keys include the authenticated user's `sub` plus a
server-generated UUID.

**Q14. Two users update the same application at once - what happens?**
A: Ownership is condition-checked, but two updates by the same owner are
last-writer-wins for overlapping attributes. If that mattered, I would add
optimistic locking with a version condition and return 409 on conflict.

**Q15. What does this cost to run?**
A: At personal scale it sits entirely in the free tier: Lambda's 1M free
requests, DynamoDB's 25 GB and 25 RCU/WCU, S3's 5 GB, and HTTP API's first
million calls. Realistically $0; at scale, cost tracks usage rather than
idle servers.

**Q16. How would you monitor this in production?**
A: Lambda logs, metrics, and traces go to CloudWatch automatically; I would
add X-Ray tracing to see per-service latency, CloudWatch alarms on 5xx
rate and DynamoDB throttles, and structured JSON logs for queryability.

**Q17. DynamoDB reads are eventually consistent by default - does that matter here?**
A: Slightly: a list right after a write could miss it. DynamoDB offers
strongly consistent reads at double the read cost. For this app eventual
consistency is fine because the UI refetches after each action and a
one-second lag is invisible to a single user.

**Q18. What would you do next to productionize it?**
A: Add Query pagination, restricted CORS, a CI deploy stage, CloudWatch
alarms, a DLQ for asynchronous failures, and possibly move the frontend
behind CloudFront with HTTPS. The current app already uses Cognito and
per-user data scoping.

**Q19. Why Vite instead of Create React App?**
A: CRA is deprecated and slow; Vite uses native ES modules in dev for
instant startup and esbuild/Rollup for fast production builds. Same React,
better tooling.

**Q20. What was the hardest bug or design decision in this project?**
A: (Make this yours - real candidates:) deciding the unit-test boundary at
the AWS SDK client; realizing updates needed `attribute_exists` to avoid
silent upserts; handling CORS in two places (preflight at API Gateway,
headers on every Lambda response); and sanitizing user filenames before
they become S3 keys.

---

## 7. Suggested weekend plan

- **Day 1**: read this guide, run the backend tests, deploy with SAM, and
  create a Cognito account through the frontend.
- **Day 2**: exercise CRUD and resume upload; verify a second account cannot
  read or modify the first account's records.
- **Day 3**: implement one improvement from Q18, then update your resume
  bullets with real numbers from your own deployment.
