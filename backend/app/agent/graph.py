"""
The AI Planner. Mirrors the workflow from the product spec:

    User -> LLM -> Intent Detection -> Planner -> Terraform Generator
         -> [Human Approval happens in the API layer, not here]
         -> Executor -> Verification -> Summary

This module owns everything up to and including "Terraform Generator" --
it turns a natural-language request into a reviewable Plan. Approval,
execution and verification are handled by app/routers/plans.py and
app/executor, deliberately outside the graph, so that "never execute
without a human clicking approve" is enforced by the API layer rather than
by prompting the model to behave -- a structural guarantee, not a hope.
"""
from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from app.agent.llm import get_chat_model
from app.agent.terraform_gen import generate_hcl
from app.agent.tools import SAFE_OPERATIONS, catalog_prompt_snippet, estimate_monthly_cost


class PlannedOperation(BaseModel):
    operation: str = Field(description="One of the catalog operation names")
    params: Dict[str, Any] = Field(default_factory=dict)


class PlanOutput(BaseModel):
    summary: str = Field(description="One sentence describing what this plan does")
    operations: List[PlannedOperation]


class GraphState(TypedDict, total=False):
    request_text: str
    summary: str
    operations: List[Dict[str, Any]]
    unsupported: List[str]
    terraform_hcl: str
    risk_level: str
    estimated_monthly_cost_usd: float


SYSTEM_PROMPT = f"""You are the planning module of Nimbus AI, an AI cloud \
engineer. You turn a plain-English infrastructure request into a precise, \
minimal list of operations drawn ONLY from this catalog:

{catalog_prompt_snippet()}

Rules:
- Only ever propose operations from the catalog above. If the request needs \
something outside it, omit it -- do not invent operations.
- Order operations sensibly (e.g. create a bucket before configuring it).
- Bucket names must be globally-unique-looking, lowercase, hyphenated.
- Keep the summary to one plain sentence a non-engineer could understand.
"""


def _plan_node(state: GraphState) -> GraphState:
    model = get_chat_model().with_structured_output(PlanOutput)
    result: PlanOutput = model.invoke(
        [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": state["request_text"]},
        ]
    )

    valid, unsupported = [], []
    for op in result.operations:
        if op.operation in SAFE_OPERATIONS:
            valid.append({"operation": op.operation, "params": op.params})
        else:
            unsupported.append(op.operation)

    return {"summary": result.summary, "operations": valid, "unsupported": unsupported}


def _terraform_node(state: GraphState) -> GraphState:
    return {"terraform_hcl": generate_hcl(state.get("operations", []))}


def _risk_and_cost_node(state: GraphState) -> GraphState:
    ops = state.get("operations", [])
    destructive = any(SAFE_OPERATIONS.get(o["operation"], {}).get("destructive") for o in ops)
    risk = "high" if destructive else ("medium" if state.get("unsupported") else "low")
    cost = estimate_monthly_cost([o["operation"] for o in ops])
    return {"risk_level": risk, "estimated_monthly_cost_usd": cost}


def build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("plan", _plan_node)
    graph.add_node("terraform", _terraform_node)
    graph.add_node("risk_and_cost", _risk_and_cost_node)

    graph.set_entry_point("plan")
    graph.add_edge("plan", "terraform")
    graph.add_edge("terraform", "risk_and_cost")
    graph.add_edge("risk_and_cost", END)

    return graph.compile()


_compiled = None


def run_planner(request_text: str) -> GraphState:
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled.invoke({"request_text": request_text})
