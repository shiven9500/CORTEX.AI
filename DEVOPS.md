# Cortex DevOps Documentation

This document explains the DevOps architecture and workflows integrated into the Cortex project to ensure scalability, reliability, and automated development cycles.

---

## 🏗️ Architecture Overview

The project is structured into two main services, orchestrated using **Docker**:

1.  **Backend**: A FastAPI application running on Python 3.11-slim.
2.  **Frontend**: A React/Vite application built with Node 20 and served via an Nginx production-ready container.

---

## 🐳 Containerization (Docker)

We use Docker to ensure the application runs identically on all machines (Development, Staging, and Production).

### Files:
- `backend/Dockerfile`: Uses a lightweight Python image, installs dependencies, and runs the Uvicorn server.
- `frontend/Dockerfile`: A **multi-stage build** that first compiles the React app and then copies the static assets to an Nginx server for high-performance serving.
- `docker-compose.yml`: Orchestrates both services, sets up networking, and manages environment variables.

### How to Run:
```bash
docker-compose up --build
```
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Frontend App**: [http://localhost:3000](http://localhost:3000)

---

## 🚀 CI/CD Pipelines (GitHub Actions)

Located in `.github/workflows/`, these pipelines automate quality control on every code change.

### 1. Backend CI (`backend-ci.yml`)
- **Triggers**: On pushes or pull requests to `backend/`.
- **Actions**:
    - Installs Python dependencies.
    - Runs **flake8** for linting (catching syntax errors and undefined names).
    - Ensures the environment is ready for deployment.

### 2. Frontend CI (`frontend-ci.yml`)
- **Triggers**: On pushes or pull requests to `frontend/`.
- **Actions**:
    - Installs Node dependencies.
    - Runs **eslint** for code quality.
    - Performs a **production build** (`npm run build`) to ensure no build-time errors exist.

---

## 🛠️ Developer Experience (Pre-commit)

We use `pre-commit` to catch errors **before** they are even committed to the repository.

- **Config**: `.pre-commit-config.yaml`
- **Checks included**:
    - Trailing whitespace removal.
    - YAML syntax verification.
    - Python code formatting (**Black**).
    - Python linting (**Flake8**).
    - Frontend linting (**ESLint**).

### Setup:
```bash
pip install pre-commit
pre-commit install
```

---

## 🩺 Health & Monitoring

To be "Cloud Native," the backend now includes health monitoring features:

1.  **Health Endpoint**: `/health` provides a quick way for load balancers and container orchestrators (like Kubernetes or AWS ECS) to verify if the service is alive.
2.  **Structured Logging**: Uses the standard Python `logging` library to output logs in a format that can be easily ingested by monitoring tools like CloudWatch, Datadog, or ELK stack.

---

## 📈 Future Scalability

This setup is ready for:
- **Cloud Deployment**: The Docker images can be pushed to AWS ECR, GCP GCR, or Docker Hub.
- **Kubernetes**: The current architecture is "Pod-ready" for orchestration.
- **Auto-scaling**: The health checks allow for automatic scaling based on service availability.