from flask import request, jsonify
from db import db
from models import Business
from datetime import datetime
import uuid
import logging


class Businesses:
    """CRUD operations for Business model"""

    @staticmethod
    def validate_uuid(uuid_string):
        """Validate UUID format"""
        try:
            uuid.UUID(uuid_string)
            return True
        except (ValueError, TypeError):
            return False

    @staticmethod
    def validate_business_data(data, is_update=False):
        """Validate business data"""
        errors = []

        if not is_update and not data.get('name'):
            errors.append('Name is required')
        elif is_update and 'name' in data and not data['name']:
            errors.append('Name cannot be empty')

        if not is_update and not data.get('user_id'):
            errors.append('User ID is required')
        elif not is_update and not Businesses.validate_uuid(data.get('user_id')):
            errors.append('Invalid user ID format')

        # Validate email format if provided
        if data.get('email'):
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append('Invalid email format')

        return errors

    @staticmethod
    def create_business():
        """Create a new business"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Validate data
            errors = Businesses.validate_business_data(data)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            # Check if user exists, if not, try to sync from Supabase Auth
            user_id = data['user_id']
            from models import User
            user = User.query.filter_by(id=user_id).first()
            
            if not user:
                # Try to find by Supabase ID (stored in google_id field)
                user = User.query.filter_by(google_id=user_id).first()
                
                if not user:
                    # User doesn't exist, return error
                    return jsonify({
                        'success': False, 
                        'error': 'User not found. Please log in again.'
                    }), 404
            
            # Use the actual user ID from the database
            actual_user_id = str(user.id)

            # Check business limit (2 businesses per user)
            business_count = Business.query.filter_by(user_id=actual_user_id).count()
            if business_count >= 2:
                return jsonify({
                    'success': False,
                    'error': 'Business limit reached',
                    'limit_reached': True,
                    'message': 'You have reached the maximum limit of 2 businesses. Please upgrade your plan to add more businesses.'
                }), 403

            # Check if business with same email already exists for this user
            if data.get('email'):
                existing_business = Business.query.filter_by(
                    user_id=actual_user_id,
                    email=data['email']
                ).first()
                if existing_business:
                    return jsonify({
                        'success': False,
                        'error': 'Business with this email already exists'
                    }), 409

            # Create new business
            business = Business(
                user_id=actual_user_id,
                name=data['name'],
                email=data.get('email'),
                address=data.get('address'),
                phone=data.get('phone'),
                website=data.get('website'),
                logo_url=data.get('logo_url'),
                tax_id=data.get('tax_id')
            )

            db.session.add(business)
            db.session.commit()

            return jsonify({
                'success': True,
                'business': {
                    'id': str(business.id),
                    'user_id': str(business.user_id),
                    'name': business.name,
                    'email': business.email,
                    'address': business.address,
                    'phone': business.phone,
                    'website': business.website,
                    'logo_url': business.logo_url,
                    'tax_id': business.tax_id,
                    'created_at': business.created_at.isoformat() if business.created_at else None,
                    'updated_at': business.updated_at.isoformat() if business.updated_at else None
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating business: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to create business'}), 500

    @staticmethod
    def get_businesses():
        """Get all businesses for a user with optional filtering and pagination"""
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'success': False, 'error': 'user_id is required'}), 400

            if not Businesses.validate_uuid(user_id):
                return jsonify({'success': False, 'error': 'Invalid user_id format'}), 400

            # Pagination parameters
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            search = request.args.get('search', '')
            limit = int(request.args.get('limit', 0))  # For autocomplete, limit results

            # Build query
            query = Business.query.filter_by(user_id=user_id)

            # Apply search filter if provided
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        Business.name.ilike(search_term),
                        Business.email.ilike(search_term),
                        Business.phone.ilike(search_term)
                    )
                )

            # Order by created_at descending
            query = query.order_by(Business.created_at.desc())

            # Apply limit for autocomplete
            if limit > 0:
                businesses = query.limit(limit).all()
                total_count = query.count()
                pagination = {
                    'total': total_count,
                    'pages': 1,
                    'per_page': limit,
                    'current_page': 1,
                    'has_prev': False,
                    'has_next': False
                }
            else:
                # Paginate
                paginated = query.paginate(
                    page=page,
                    per_page=per_page,
                    error_out=False
                )
                businesses = paginated.items
                total_count = paginated.total
                pagination = {
                    'total': paginated.total,
                    'pages': paginated.pages,
                    'per_page': per_page,
                    'current_page': page,
                    'has_prev': paginated.has_prev,
                    'has_next': paginated.has_next
                }

            business_list = []
            for business in businesses:
                # Count invoices for this business
                invoice_count = len(business.invoices) if business.invoices else 0

                business_list.append({
                    'id': str(business.id),
                    'user_id': str(business.user_id),
                    'name': business.name,
                    'email': business.email,
                    'address': business.address,
                    'phone': business.phone,
                    'website': business.website,
                    'logo_url': business.logo_url,
                    'tax_id': business.tax_id,
                    'invoice_count': invoice_count,
                    'created_at': business.created_at.isoformat() if business.created_at else None,
                    'updated_at': business.updated_at.isoformat() if business.updated_at else None
                })

            return jsonify({
                'success': True,
                'businesses': business_list,
                'pagination': pagination
            }), 200

        except Exception as e:
            logging.error(f"Error getting businesses: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get businesses'}), 500

    @staticmethod
    def get_business(business_id):
        """Get a specific business by ID"""
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            # Count invoices for this business
            invoice_count = len(business.invoices) if business.invoices else 0

            return jsonify({
                'success': True,
                'business': {
                    'id': str(business.id),
                    'user_id': str(business.user_id),
                    'name': business.name,
                    'email': business.email,
                    'address': business.address,
                    'phone': business.phone,
                    'website': business.website,
                    'logo_url': business.logo_url,
                    'tax_id': business.tax_id,
                    'invoice_count': invoice_count,
                    'created_at': business.created_at.isoformat() if business.created_at else None,
                    'updated_at': business.updated_at.isoformat() if business.updated_at else None
                }
            })

        except Exception as e:
            logging.error(f"Error getting business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to get business'}), 500

    @staticmethod
    def update_business(business_id):
        """Update a business"""
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Validate data for update
            errors = Businesses.validate_business_data(data, is_update=True)
            if errors:
                return jsonify({'success': False, 'errors': errors}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            # Check if email is being changed and if it conflicts with another business
            if data.get('email') and data['email'] != business.email:
                existing_business = Business.query.filter_by(
                    user_id=business.user_id,
                    email=data['email']
                ).filter(Business.id != business_id).first()

                if existing_business:
                    return jsonify({
                        'success': False,
                        'error': 'Another business with this email already exists'
                    }), 409

            # Update fields
            if 'name' in data:
                business.name = data['name']
            if 'email' in data:
                business.email = data['email']
            if 'address' in data:
                business.address = data['address']
            if 'phone' in data:
                business.phone = data['phone']
            if 'website' in data:
                business.website = data['website']
            if 'logo_url' in data:
                business.logo_url = data['logo_url']
            if 'tax_id' in data:
                business.tax_id = data['tax_id']

            business.updated_at = datetime.utcnow()
            db.session.commit()

            # Count invoices for response
            invoice_count = len(business.invoices) if business.invoices else 0

            return jsonify({
                'success': True,
                'business': {
                    'id': str(business.id),
                    'user_id': str(business.user_id),
                    'name': business.name,
                    'email': business.email,
                    'address': business.address,
                    'phone': business.phone,
                    'website': business.website,
                    'logo_url': business.logo_url,
                    'tax_id': business.tax_id,
                    'invoice_count': invoice_count,
                    'created_at': business.created_at.isoformat() if business.created_at else None,
                    'updated_at': business.updated_at.isoformat() if business.updated_at else None
                }
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error updating business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to update business'}), 500

    @staticmethod
    def delete_business(business_id):
        """Delete a business"""
        try:
            if not Businesses.validate_uuid(business_id):
                return jsonify({'success': False, 'error': 'Invalid business ID format'}), 400

            business = Business.query.get(business_id)
            if not business:
                return jsonify({'success': False, 'error': 'Business not found'}), 404

            # Check if business has invoices
            if business.invoices:
                return jsonify({
                    'success': False,
                    'error': f'Cannot delete business. Business has {len(business.invoices)} associated invoices.'
                }), 400

            db.session.delete(business)
            db.session.commit()

            return jsonify({
                'success': True,
                'message': 'Business deleted successfully'
            })

        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting business {business_id}: {str(e)}", exc_info=True)
            return jsonify({'success': False, 'error': 'Failed to delete business'}), 500 