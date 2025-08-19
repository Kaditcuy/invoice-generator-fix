from models import User
from db import db
from datetime import datetime
import uuid

def sync_user_from_supabase(supabase_user_id, email=None, first_name=None, last_name=None):
    """
    Sync a user from Supabase Auth to the local database.
    Returns the user object if successful, None if failed.
    """
    try:
        # Check if user already exists by Supabase ID (stored in google_id field)
        existing_user = User.query.filter_by(google_id=supabase_user_id).first()
        
        if existing_user:
            return existing_user
        
        # Check if user exists by email
        if email:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                # Update the existing user with the Supabase ID
                existing_user.google_id = supabase_user_id
                if not existing_user.first_name and first_name:
                    existing_user.first_name = first_name
                if not existing_user.last_name and last_name:
                    existing_user.last_name = last_name
                existing_user.updated_at = datetime.utcnow()
                db.session.commit()
                return existing_user
        
        # Create new user
        new_user = User(
            id=uuid.uuid4(),  # Generate a new UUID for the local database
            email=email or f"user_{supabase_user_id[:8]}@temp.com",
            first_name=first_name or "",
            last_name=last_name or "",
            google_id=supabase_user_id,  # Store Supabase user ID here
            password_hash=None,  # No password for OAuth users
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"Created new user: {new_user.id} for Supabase user: {supabase_user_id}")
        return new_user
        
    except Exception as e:
        db.session.rollback()
        print(f"Error syncing user: {e}")
        return None

def get_or_create_user(supabase_user_id, email=None, first_name=None, last_name=None):
    """
    Get existing user or create new one from Supabase Auth data.
    Returns the user object.
    """
    # First try to find by Supabase ID
    user = User.query.filter_by(google_id=supabase_user_id).first()
    
    if not user:
        # Try to find by email
        if email:
            user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user
            user = sync_user_from_supabase(supabase_user_id, email, first_name, last_name)
        else:
            # Update existing user with Supabase ID
            user.google_id = supabase_user_id
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
            user.updated_at = datetime.utcnow()
            db.session.commit()
    
    return user
