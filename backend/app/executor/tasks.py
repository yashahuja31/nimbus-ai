import json

from celery import shared_task

from app.database import SessionLocal
from app.executor.s3_executor import DISPATCH
from app.models import ExecutionLog, Plan, PlanStatus, PlanStep


@shared_task(name="execute_plan_step")
def execute_plan_step(step_id: str):
    db = SessionLocal()
    try:
        step = db.query(PlanStep).filter(PlanStep.id == step_id).first()
        if not step:
            return

        plan = db.query(Plan).filter(Plan.id == step.plan_id).first()
        params = json.loads(step.params_json or "{}")
        handler = DISPATCH.get(step.operation)

        if not handler:
            step.status = PlanStatus.failed
            db.add(ExecutionLog(plan_id=plan.id, step_id=step.id, level="error",
                                 message=f"No executor registered for '{step.operation}'"))
            db.commit()
            return

        try:
            result_message = handler(params)
            step.status = PlanStatus.completed
            db.add(ExecutionLog(plan_id=plan.id, step_id=step.id, level="success",
                                 message=result_message))
        except Exception as exc:  # noqa: BLE001
            step.status = PlanStatus.failed
            db.add(ExecutionLog(plan_id=plan.id, step_id=step.id, level="error",
                                 message=f"{step.operation} failed: {exc}"))

        db.commit()

        # Verification: once every step has resolved, roll the plan status up
        # and drop a summary log line -- the "Verification -> Summary" tail
        # of the AI workflow.
        remaining = [s for s in plan.steps if s.status == PlanStatus.executing
                     or s.status == PlanStatus.proposed or s.status == PlanStatus.approved]
        if not remaining:
            failed = [s for s in plan.steps if s.status == PlanStatus.failed]
            plan.status = PlanStatus.failed if failed else PlanStatus.completed
            db.add(ExecutionLog(
                plan_id=plan.id, step_id=None,
                level="error" if failed else "success",
                message=("Plan finished with failures." if failed
                          else "Plan completed successfully. All steps verified."),
            ))
            db.commit()
    finally:
        db.close()
