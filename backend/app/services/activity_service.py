from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog, ActivityType
from app.models.user import User
from fastapi import HTTPException
from typing import List
import json

def log_activity(
        db: Session,
        user_email: str,
        activity_type: str,
        resource_type: str,
        resource_id: int,
        resource_name: str,
        details: dict = None
):
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return None
        activity = ActivityLog(
            user_id=user.id,
            activity_type=activity_type,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            details=json.dumps(details) if details else None
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

        return activity
    except Exception as e:
        print(f"Failed to log activity: {e}")
        db.rollback()
        return None
def get_user_activities(db: Session, user_email: str, limit: int = 50):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return []

    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return activities

def get_resource_activities(
        db: Session,
        resource_type: str,
        resource_id: int,
        limit: int = 20
):
    activities = db.query(ActivityLog).filter(
        ActivityLog.resource_type == resource_type,
        ActivityLog.resource_id == resource_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return activities
def delete_activity(db: Session, activity_id: int, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.user_id == user.id
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()

    return {"message": "Activity deleted successfully"}
def bulk_delete_activities(db: Session, activity_ids: List[int], user_email: str):
    """Delete multiple activities"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    deleted_count = db.query(ActivityLog).filter(
        ActivityLog.id.in_(activity_ids),
        ActivityLog.user_id == user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": f"{deleted_count} activities deleted successfully",
        "deleted_count": deleted_count
    }
def clear_all_activities(db: Session, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    count = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).count()
    db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": f"All {count} activities cleared successfully",
        "deleted_count": count
    }