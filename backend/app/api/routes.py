# backend/app/api/routes.py
from __future__ import annotations

from fastapi import APIRouter
from app.schemas import PlanRequest, PlanResponse
from app.services.optimizer import build_plan
from app.services.city_data import supported_countries

router = APIRouter()


@router.get("/countries")
def get_countries():
    return {"countries": supported_countries()}


@router.post("/plan", response_model=PlanResponse)
def create_plan(req: PlanRequest):
    return build_plan(req)
