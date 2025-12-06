"""EPP API Client"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class RiskFactor(BaseModel):
    """Risk factor model"""

    name: str
    impact: str
    severity: float


class RiskyDeliverable(BaseModel):
    """Deliverable with misestimation statistics"""

    name: str
    avg_error: float
    sample_size: int


class SimilarProject(BaseModel):
    """Similar historical project"""

    name: str
    year: int
    actual_cost: float
    actual_duration: int
    similarity_score: float


class Prediction(BaseModel):
    """Prediction result model"""

    # Cost predictions
    cost_p50: float
    cost_p80: float
    cost_p90: float

    # Schedule predictions
    duration_p50: int
    duration_p80: int
    duration_p90: int

    # Explanations
    confidence_score: float
    top_risk_factors: List[RiskFactor]
    risky_deliverables: List[RiskyDeliverable]
    similar_projects: List[SimilarProject]

    # Metadata
    prediction_id: str
    model_version: str


class EPPClient:
    """Client for interacting with EPP API"""

    def __init__(self, api_key: str, company_id: str, base_url: str = "http://localhost:8000"):
        """Initialize EPP client

        Args:
            api_key: API authentication key
            company_id: Company identifier
            base_url: Base URL for API server
        """
        self.api_key = api_key
        self.company_id = company_id
        self.base_url = base_url.rstrip("/")

    def predict(self, project: Dict[str, Any]) -> Prediction:
        """Make a prediction for a new project

        Args:
            project: Project definition dictionary with keys:
                - name: Project name
                - description: Project scope description
                - location: Location dict (country, region)
                - project_type: Type of project
                - contract_type: Contract type
                - estimated_size: Size dict (value, unit)

        Returns:
            Prediction object with cost/schedule estimates and explanations

        Raises:
            NotImplementedError: This is a stub implementation
        """
        raise NotImplementedError(
            "Client implementation pending. "
            "This will call POST /api/v1/predict endpoint when API is implemented."
        )

    def get_similar_projects(
        self, project_id: str, top_k: int = 5
    ) -> List[SimilarProject]:
        """Find similar historical projects

        Args:
            project_id: Project identifier
            top_k: Number of similar projects to return

        Returns:
            List of similar projects

        Raises:
            NotImplementedError: This is a stub implementation
        """
        raise NotImplementedError(
            "Client implementation pending. "
            "This will call GET /api/v1/similar/{project_id} endpoint."
        )
