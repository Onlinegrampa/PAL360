import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

SEEDS_DIR = Path(__file__).parent.parent / "data" / "seeds"


class Product(BaseModel):
    product_id: str
    line: Literal["Life", "Health", "Annuities", "PA&S"]
    name: str
    benefits: list[str]
    cost_range: str
    use_case: str


def _load_products() -> list[dict]:
    path = SEEDS_DIR / "products.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


@router.get("/products", response_model=list[Product])
def get_products():
    return _load_products()


@router.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    for p in _load_products():
        if p["product_id"] == product_id:
            return p
    raise HTTPException(status_code=404, detail="Product not found")
