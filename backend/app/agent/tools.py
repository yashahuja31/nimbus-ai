"""
Phase 1 deliberately supports a *small, safe* operation catalog rather than
arbitrary AWS calls -- this is the "few safe operations" boundary called out
in the product spec. Later phases (2+) grow this catalog; the plan/approve/
execute machinery around it does not need to change to support that growth.
"""
from typing import Any, Dict, List

SAFE_OPERATIONS: Dict[str, Dict[str, Any]] = {
    "s3.create_bucket": {
        "description": "Create a new S3 bucket",
        "required_params": ["bucket_name"],
        "destructive": False,
    },
    "s3.enable_versioning": {
        "description": "Enable versioning on an S3 bucket",
        "required_params": ["bucket_name"],
        "destructive": False,
    },
    "s3.enable_encryption": {
        "description": "Enable default AES-256 server-side encryption on an S3 bucket",
        "required_params": ["bucket_name"],
        "destructive": False,
    },
}


def catalog_prompt_snippet() -> str:
    lines = [f"- {name}: {meta['description']} (params: {meta['required_params']})"
             for name, meta in SAFE_OPERATIONS.items()]
    return "\n".join(lines)


# Flat, static estimate table for the MVP. Phase 4 (Cost Optimization)
# replaces this with real Cost Explorer / pricing-API lookups.
_MONTHLY_COST_USD = {
    "s3.create_bucket": 0.50,
    "s3.enable_versioning": 0.25,
    "s3.enable_encryption": 0.00,
}


def estimate_monthly_cost(operations: List[str]) -> float:
    return round(sum(_MONTHLY_COST_USD.get(op, 0.0) for op in operations), 2)
