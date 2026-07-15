"""
Generates human-reviewable Terraform for each planned step. This is the
"Terraform Generator" stage of the AI workflow: User -> LLM -> Intent
Detection -> Planner -> Terraform Generator -> Human Approval -> Executor.

The MVP does not shell out to `terraform apply` -- the generated HCL is
shown to the user for review/audit and the actual change is made through
boto3 in app/executor (simpler to sandbox behind DRY_RUN, no state backend
to stand up for a first deploy). Wiring this HCL into a real `terraform
apply` with remote state is a natural Phase 2 upgrade; the module stub in
infra/terraform/modules/s3_bucket already matches this output.
"""
from typing import Any, Dict, List


def _resource_name(bucket_name: str) -> str:
    return bucket_name.replace(".", "_").replace("-", "_")


def generate_hcl(operations: List[Dict[str, Any]]) -> str:
    blocks = []
    seen_buckets = set()

    for op in operations:
        bucket = op["params"].get("bucket_name", "unnamed-bucket")
        res = _resource_name(bucket)

        if op["operation"] == "s3.create_bucket" and bucket not in seen_buckets:
            blocks.append(
                f'resource "aws_s3_bucket" "{res}" {{\n'
                f'  bucket = "{bucket}"\n'
                f"}}"
            )
            seen_buckets.add(bucket)

        elif op["operation"] == "s3.enable_versioning":
            blocks.append(
                f'resource "aws_s3_bucket_versioning" "{res}_versioning" {{\n'
                f'  bucket = aws_s3_bucket.{res}.id\n'
                f"  versioning_configuration {{\n"
                f'    status = "Enabled"\n'
                f"  }}\n"
                f"}}"
            )

        elif op["operation"] == "s3.enable_encryption":
            blocks.append(
                f'resource "aws_s3_bucket_server_side_encryption_configuration" "{res}_sse" {{\n'
                f'  bucket = aws_s3_bucket.{res}.id\n'
                f"  rule {{\n"
                f"    apply_server_side_encryption_by_default {{\n"
                f'      sse_algorithm = "AES256"\n'
                f"    }}\n"
                f"  }}\n"
                f"}}"
            )

    return "\n\n".join(blocks)
