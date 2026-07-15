"""
Executes exactly the operations in the Phase-1 safe catalog. Every function
respects settings.dry_run: with it on (the default), the call is validated
and logged but never actually sent to AWS. This is the concrete mechanism
behind "never execute destructive actions without explicit approval" --
approval flips a plan's status, but a human still has to explicitly turn
dry_run off in the environment before anything touches a real account.
"""
import boto3

from app.config import settings


def _client():
    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
    )


def create_bucket(bucket_name: str) -> str:
    if settings.dry_run:
        return f"[dry-run] would create bucket '{bucket_name}' in {settings.aws_region}"
    client = _client()
    if settings.aws_region == "us-east-1":
        client.create_bucket(Bucket=bucket_name)
    else:
        client.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={"LocationConstraint": settings.aws_region},
        )
    return f"created bucket '{bucket_name}'"


def enable_versioning(bucket_name: str) -> str:
    if settings.dry_run:
        return f"[dry-run] would enable versioning on '{bucket_name}'"
    client = _client()
    client.put_bucket_versioning(
        Bucket=bucket_name, VersioningConfiguration={"Status": "Enabled"}
    )
    return f"enabled versioning on '{bucket_name}'"


def enable_encryption(bucket_name: str) -> str:
    if settings.dry_run:
        return f"[dry-run] would enable AES256 encryption on '{bucket_name}'"
    client = _client()
    client.put_bucket_encryption(
        Bucket=bucket_name,
        ServerSideEncryptionConfiguration={
            "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
        },
    )
    return f"enabled encryption on '{bucket_name}'"


DISPATCH = {
    "s3.create_bucket": lambda params: create_bucket(params["bucket_name"]),
    "s3.enable_versioning": lambda params: enable_versioning(params["bucket_name"]),
    "s3.enable_encryption": lambda params: enable_encryption(params["bucket_name"]),
}
