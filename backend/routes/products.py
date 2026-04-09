import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from db import get_pool

router = APIRouter()


class Product(BaseModel):
    product_id: str
    plan_code: str = ""
    line: Literal["Life", "Health", "Annuities", "PA&S"]
    name: str
    benefits: list[str]
    use_case: str


def _fmt_product(row) -> dict:
    d = dict(row)
    benefits = d.get("benefits", [])
    if isinstance(benefits, str):
        benefits = json.loads(benefits)
    d["benefits"] = benefits
    return d


@router.get("/products", response_model=list[Product])
async def get_products():
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT product_id, plan_code, line, name, benefits, use_case FROM products ORDER BY product_id"
        )
    return [_fmt_product(r) for r in rows]


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT product_id, plan_code, line, name, benefits, use_case FROM products WHERE product_id = $1",
            product_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return _fmt_product(row)
