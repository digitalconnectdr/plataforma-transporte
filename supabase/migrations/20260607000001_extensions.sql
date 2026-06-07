-- F1.1 Migration 01: Extensions & Base Setup
-- LuxeRide — Premium Multi-Tenant Transportation Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy search on names
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- accent-insensitive search

-- Custom ENUM types
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'company_owner',
  'company_admin',
  'dispatcher',
  'accounting',
  'driver',
  'customer',
  'corporate_manager',
  'corporate_user'
);

CREATE TYPE company_status AS ENUM (
  'active',
  'suspended',
  'trial',
  'cancelled'
);

CREATE TYPE company_plan AS ENUM (
  'free',
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE vehicle_class AS ENUM (
  'sedan',
  'suv',
  'van',
  'limousine',
  'sprinter',
  'bus',
  'exotic'
);

CREATE TYPE vehicle_status AS ENUM (
  'available',
  'on_trip',
  'maintenance',
  'offline',
  'retired'
);

CREATE TYPE booking_status AS ENUM (
  'quote',
  'pending',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'failed'
);

CREATE TYPE booking_type AS ENUM (
  'one_way',
  'round_trip',
  'hourly',
  'airport_pickup',
  'airport_dropoff',
  'point_to_point'
);

CREATE TYPE pricing_model AS ENUM (
  'flat_rate',
  'per_mile',
  'per_km',
  'hourly',
  'zone_based'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

CREATE TYPE payment_method_type AS ENUM (
  'card',
  'cash',
  'corporate_account',
  'bank_transfer'
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'push',
  'in_app'
);

CREATE TYPE document_type AS ENUM (
  'drivers_license',
  'vehicle_registration',
  'insurance',
  'background_check',
  'medical_certificate',
  'other'
);

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
