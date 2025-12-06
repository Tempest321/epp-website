.PHONY: help install lint format test clean

help:
	@echo "EPP Development Commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make lint       - Run linters (flake8, mypy)"
	@echo "  make format     - Format code (black, isort)"
	@echo "  make test       - Run test suite"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make db-init    - Initialize database"
	@echo "  make db-migrate - Run database migrations"

install:
	pip install -e ".[dev]"

lint:
	flake8 src/ tests/
	mypy src/

format:
	black src/ tests/
	isort src/ tests/

test:
	pytest

test-cov:
	pytest --cov=epp --cov-report=html --cov-report=term

clean:
	rm -rf build/ dist/ *.egg-info
	rm -rf .pytest_cache .mypy_cache .coverage htmlcov
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

db-init:
	createdb epp_dev || echo "Database already exists"
	psql epp_dev < docs/schema.sql

db-migrate:
	alembic upgrade head

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
