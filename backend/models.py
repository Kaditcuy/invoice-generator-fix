import uuid
from datetime import datetime
from db import db  # <-- import db from db.py
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Client(db.Model):
    __tablename__ = 'clients'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    address = Column(Text)
    phone = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship('User', backref='clients')
    invoices = relationship('Invoice', backref='client')

class Business(db.Model):
    __tablename__ = 'businesses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    address = Column(Text)
    phone = Column(String(50))
    website = Column(String(255))
    logo_url = Column(String(500))
    tax_id = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship('User', backref='businesses')
    invoices = relationship('Invoice', backref='business')

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    business_id = Column(UUID(as_uuid=True), ForeignKey('businesses.id'), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey('clients.id'), nullable=True)
    invoice_number = Column(String(100), unique=True, nullable=False)
    data = Column(JSON, nullable=False)
    status = Column(String(50), default='draft')
    issued_date = Column(DateTime(timezone=True))
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    currency = Column(String(10), default='USD')
    
    # Relationships
    user = relationship('User', backref='invoices')