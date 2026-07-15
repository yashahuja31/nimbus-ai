# Reference module matching the shape of what backend/app/agent/terraform_gen.py
# produces per plan. Not wired into the MVP's execution path (the executor
# talks to AWS via boto3 directly, see backend/app/executor) -- this exists
# so the generated HCL has a real module to graduate into once you add a
# `terraform apply` step to the Executor stage.

variable "bucket_name" {
  type = string
}

variable "enable_versioning" {
  type    = bool
  default = true
}

variable "enable_encryption" {
  type    = bool
  default = true
}

resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "this" {
  count  = var.enable_versioning ? 1 : 0
  bucket = aws_s3_bucket.this.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.this.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

output "bucket_arn" {
  value = aws_s3_bucket.this.arn
}
