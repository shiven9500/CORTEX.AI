# Cortex - Mood AI Engine

Cortex is a sophisticated AI-powered emotional analysis engine featuring a FastAPI backend and a modern React/Vite frontend. It utilizes Gemini AI for deep emotional intelligence and a local "Neural Lite" fallback system for efficiency and offline support.

## 🚀 Quick Start (DevOps Ready)

This project is fully containerized for a seamless developer experience.

### Prerequisites
- Docker & Docker Compose installed.

### Run the Application
Start the entire stack with a single command:
```bash
docker-compose up --build
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ DevOps Features

We have integrated modern DevOps practices to ensure high-quality code and easy deployments:

- **Docker & Orchestration**: consistent environments across all stages.
- **CI/CD (GitHub Actions)**: Automated linting, testing, and builds on every push.
- **Pre-commit Hooks**: Local automation to catch errors before they reach the repo.
- **Observability**: Health endpoints and structured logging for production readiness.

For more detailed technical explanations, see [DEVOPS.md](./DEVOPS.md).

---

## 📂 Project Structure

- `/backend`: FastAPI application, ML models, and data pipelines.
- `/frontend`: React + TypeScript + Vite frontend.
- `/.github`: CI/CD workflow configurations.
- `docker-compose.yml`: Local orchestration setup.

---

## 🤝 Contributing

1. Install pre-commit: `pip install pre-commit`
2. Set up hooks: `pre-commit install`
3. Happy coding!