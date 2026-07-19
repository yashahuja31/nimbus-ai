from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CloudAccount, User
from app.schemas import CloudAccountCreate, CloudAccountOut
from app.security import get_current_user

router = APIRouter(prefix="/cloud-accounts", tags=["cloud-accounts"])


@router.get("", response_model=list[CloudAccountOut])
def list_accounts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(CloudAccount).filter(CloudAccount.owner_id == user.id).all()


@router.post("", response_model=CloudAccountOut)
def connect_account(payload: CloudAccountCreate, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    # MVP note: this records *that* an account is connected. The actual
    # credentials Nimbus operates with come from the backend's own
    # environment (app/config.py) -- per customer credential storage with a
    # real secrets manager is an enterprise (Phase 9) concern.
    account = CloudAccount(owner_id=user.id, provider=payload.provider,
                            label=payload.label, region=payload.region)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def remove_account(account_id: str, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    account = (db.query(CloudAccount)
               .filter(CloudAccount.id == account_id, CloudAccount.owner_id == user.id)
               .first())
    if not account:
        raise HTTPException(status_code=404, detail="Cloud account not found")
    db.delete(account)
    db.commit()
