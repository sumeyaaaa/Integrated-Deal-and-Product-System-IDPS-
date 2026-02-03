"""
PMS Data Models (Pydantic Schemas)
==================================

These models describe the Product Management System (PMS) entities:
- chemical_types
- tds_data
- partner_data
- leanchem_products
- costing_pricing_data\

They are thin "contracts" between the FastAPI layer and the outside world.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel


# =============================
# CHEMICAL TYPES
# =============================


class ChemicalTypeBase(BaseModel):
    name: str
    category: Optional[str] = None
    hs_code: Optional[str] = None
    applications: Optional[List[str]] = None
    spec_template: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ChemicalTypeCreate(ChemicalTypeBase):
    pass


class ChemicalTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    hs_code: Optional[str] = None
    applications: Optional[List[str]] = None
    spec_template: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ChemicalType(ChemicalTypeBase):
    id: UUID
    created_at: Optional[datetime] = None


class ChemicalTypeListResponse(BaseModel):
    chemicals: List[ChemicalType]
    total: int


# =============================
# TDS DATA (Product master)
# =============================


class TdsBase(BaseModel):
    chemical_type_id: Optional[UUID] = None
    brand: Optional[str] = None
    grade: Optional[str] = None
    owner: Optional[str] = None
    source: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class TdsCreate(TdsBase):
    pass


class TdsUpdate(BaseModel):
    chemical_type_id: Optional[UUID] = None
    brand: Optional[str] = None
    grade: Optional[str] = None
    owner: Optional[str] = None
    source: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class Tds(TdsBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TdsListResponse(BaseModel):
    tds: List[Tds]
    total: int


# =============================
# PARTNER DATA
# =============================


class PartnerBase(BaseModel):
    partner: Optional[str] = None
    partner_country: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    partner: Optional[str] = None
    partner_country: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Partner(PartnerBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PartnerListResponse(BaseModel):
    partners: List[Partner]
    total: int


# =============================
# LEANCHEM PRODUCTS
# =============================


class LeanchemProductBase(BaseModel):
    tds_id: Optional[UUID] = None
    category: Optional[str] = None
    product_type: Optional[str] = None
    sample_addis: Optional[Dict[str, Any]] = None
    stock_addis: Optional[Dict[str, Any]] = None
    stock_nairobi: Optional[Dict[str, Any]] = None
    prices: Optional[Dict[str, Any]] = None


class LeanchemProductCreate(LeanchemProductBase):
    pass


class LeanchemProductUpdate(BaseModel):
    tds_id: Optional[UUID] = None
    category: Optional[str] = None
    product_type: Optional[str] = None
    sample_addis: Optional[Dict[str, Any]] = None
    stock_addis: Optional[Dict[str, Any]] = None
    stock_nairobi: Optional[Dict[str, Any]] = None
    prices: Optional[Dict[str, Any]] = None


class LeanchemProduct(LeanchemProductBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class LeanchemProductListResponse(BaseModel):
    products: List[LeanchemProduct]
    total: int


# =============================
# COSTING / PRICING DATA
# =============================


class CostingPricingBase(BaseModel):
    partner_id: UUID
    tds_id: UUID
    rows: Optional[List[Dict[str, Any]]] = None


class CostingPricingCreate(CostingPricingBase):
    pass


class CostingPricingUpdate(BaseModel):
    partner_id: Optional[UUID] = None
    tds_id: Optional[UUID] = None
    rows: Optional[List[Dict[str, Any]]] = None


class CostingPricing(CostingPricingBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CostingPricingListResponse(BaseModel):
    pricing: List[CostingPricing]
    total: int


# =============================
# PARTNER CHEMICALS
# =============================


class PartnerChemicalBase(BaseModel):
    vendor: str
    product_category: str
    sub_category: Optional[str] = None
    product_name: str
    brand: Optional[str] = None
    packing: str
    price: Optional[float] = None
    competitive_price: Optional[float] = None
    cost: Optional[float] = None
    tds_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None


class PartnerChemicalCreate(PartnerChemicalBase):
    pass


class PartnerChemicalUpdate(BaseModel):
    vendor: Optional[str] = None
    product_category: Optional[str] = None
    sub_category: Optional[str] = None
    product_name: Optional[str] = None
    brand: Optional[str] = None
    packing: Optional[str] = None
    price: Optional[float] = None
    competitive_price: Optional[float] = None
    cost: Optional[float] = None
    tds_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None


class PartnerChemical(PartnerChemicalBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PartnerChemicalListResponse(BaseModel):
    partner_chemicals: List[PartnerChemical]
    total: int


 