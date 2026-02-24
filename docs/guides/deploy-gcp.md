# Deploying the AI Front Desk to GCP

This guide covers deploying the **front-desk** Next.js app to Google Cloud Platform, with **Cloud Run** as the primary target.

## Quick start

**One-time setup:** Set your project, enable APIs, create the OpenAI secret, and (for Cloud Build) create the Artifact Registry repo:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud secrets create openai-api-key --data-file=./front-desk/.env.local   # or add in Console
# For Cloud Build only:
gcloud artifacts repositories create front-desk --repository-format=docker --location=us-central1
```

**Deploy (choose one):**

- **From source** (Cloud Build builds the image for you; uses `front-desk/.gcloudignore` to skip unneeded files):

  ```bash
  gcloud run deploy front-desk --source=./front-desk --region=us-central1 --allow-unauthenticated --set-secrets=OPENAI_API_KEY=openai-api-key:latest
  ```

- **From repo with Cloud Build** (build + push + deploy in one submit):

  ```bash
  gcloud builds submit --config=cloudbuild.yaml
  ```

Grant the Cloud Run service account **Secret Manager Secret Accessor** on `openai-api-key` (IAM or secret permissions). Then open the Cloud Run service URL.

## Create a new GCP project

If you don’t have a project yet, create one and enable billing:

```bash
# Pick a unique project ID (lowercase, numbers, hyphens; e.g. my-company-front-desk)
export PROJECT_ID=your-unique-project-id

gcloud projects create $PROJECT_ID --name="Front Desk (Prototype)"
gcloud config set project $PROJECT_ID
```

**Enable billing** (required for Cloud Run):

- In the [Console](https://console.cloud.google.com/billing): Billing → Link a billing account to this project, or
- Via gcloud if you have a billing account ID:  
  `gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID`

Then continue with the [Quick start](#quick-start) (enable APIs, create secret, deploy).

## Overview

| Component      | Choice / note |
|----------------|---------------|
| **App**        | Next.js 16 (front-desk), standalone output |
| **Compute**    | Cloud Run (container) |
| **Secrets**   | Secret Manager → env vars at runtime |
| **Data**      | SQLite in container (ephemeral by default); see [Data persistence](#data-persistence) for production options |

## Prerequisites

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and logged in
- A GCP project with billing enabled
- Docker (for local image build, or use Cloud Build)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Enable required APIs:

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 1. Build and run locally with Docker

From the repo root:

```bash
cd front-desk
docker build -t front-desk .
docker run -p 3000:3000 -e OPENAI_API_KEY="your-key-here" front-desk
```

Open http://localhost:3000. The app uses SQLite inside the container at `/app/data/front-desk.db` (created on first run).

## 2. Deploy to Cloud Run

### Option A: Deploy from source (Cloud Build builds the image)

From the **repo root** (parent of `front-desk`):

```bash
gcloud run deploy front-desk \
  --source=./front-desk \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-secrets=OPENAI_API_KEY=openai-api-key:latest
```

You must create the secret first (see [Secrets](#3-secrets-openai_api_key)).

### Option B: Deploy a pre-built image

Build and push to Artifact Registry, then deploy:

```bash
# One-time: create Artifact Registry repo
gcloud artifacts repositories create front-desk --repository-format=docker --location=us-central1

# Build and push (replace PROJECT_ID and REGION)
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/front-desk/front-desk:latest ./front-desk
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/front-desk/front-desk:latest

# Deploy
gcloud run deploy front-desk \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/front-desk/front-desk:latest \
  --region=${REGION} \
  --allow-unauthenticated \
  --set-secrets=OPENAI_API_KEY=openai-api-key:latest
```

### Memory and CPU

Default Cloud Run settings are usually enough. For heavier traffic or long LLM calls, increase:

```bash
gcloud run services update front-desk \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=60
```

`maxDuration` in the chat API route is 30s; Cloud Run timeout should be ≥ that.

## 3. Secrets (OPENAI_API_KEY)

Never put the API key in the image or in plain env in the console. Use Secret Manager.

Create the secret (one-time):

```bash
# From a file (recommended): put the key in a file that is gitignored, then:
gcloud secrets create openai-api-key --data-file=./front-desk/.env.local

# Or create and add the key in the GCP Console: Secret Manager → Create secret
# Name: openai-api-key, value: sk-...
```

Grant Cloud Run access to the secret:

- When using `--set-secrets=OPENAI_API_KEY=openai-api-key:latest`, Cloud Run automatically uses the default compute service account. That account needs **Secret Manager Secret Accessor** on the secret.
- In Console: IAM → find the Cloud Run service account (e.g. `PROJECT_NUMBER-compute@developer.gserviceaccount.com`) → add role **Secret Manager Secret Accessor**, or grant the role on the specific secret.

## 4. Data persistence (SQLite)

- **Default (Cloud Run):** The container filesystem is **ephemeral**. SQLite writes to `/app/data` inside the container; data is lost when the revision scales to zero or a new instance starts. Fine for demos and short-lived prototypes.
- **For production:** Prefer a managed database:
  - **Cloud SQL (Postgres or MySQL):** Add a client (e.g. `pg`), point the app at it via env (e.g. `DATABASE_URL`), and migrate the schema. Then deploy the same container to Cloud Run with `DATABASE_URL` set.
  - **Keep SQLite only if** you run on a single instance (e.g. GCE VM or Cloud Run with min instances = 1) and attach a **persistent disk** or **Filestore** for the data directory. This is more operational work than Cloud SQL.

For this prototype, deploying as-is gives you a working app with ephemeral SQLite; plan a Cloud SQL (or similar) migration when you need durable data.

## 5. Environment variables summary

| Variable         | Required | Notes |
|------------------|----------|--------|
| `OPENAI_API_KEY`| Yes      | Set via Secret Manager in Cloud Run |
| `DATABASE_PATH` | No       | Default in container: `/app/data/front-desk.db` |

## 6. Cloud Build (CI)

The repo includes **`cloudbuild.yaml`** at the repo root. Use it to build, push, and deploy in one go:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

To deploy on every push, connect the repo to **Cloud Build Triggers** in the GCP Console (Triggers → Connect repository → Create trigger). Set the config path to `cloudbuild.yaml` and the branch to deploy (e.g. `main`).

## Quick reference

- **Local Docker:** `cd front-desk && docker build -t front-desk . && docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... front-desk`
- **Deploy from source:** `gcloud run deploy front-desk --source=./front-desk --region=us-central1 --set-secrets=OPENAI_API_KEY=openai-api-key:latest`
- **Secrets:** Create `openai-api-key` in Secret Manager; grant the Cloud Run service account **Secret Manager Secret Accessor**.
