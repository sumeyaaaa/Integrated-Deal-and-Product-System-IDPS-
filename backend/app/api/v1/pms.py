"""
PMS API Routes
==============

HTTP endpoints for Product Management System functionality:
- /pms/chemicals   → chemical_types
- /pms/tds         → tds_data
- /pms/partners    → partner_data
- /pms/products    → leanchem_products
- /pms/pricing     → costing_pricing_data
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends

logger = logging.getLogger(__name__)

from app.models.pms import (
    ChemicalType,
    ChemicalTypeCreate,
    ChemicalTypeListResponse,
    Tds,
    TdsCreate,
    TdsListResponse,
    Partner,
    PartnerCreate,
    PartnerListResponse,
    LeanchemProduct,
    LeanchemProductCreate,
    LeanchemProductListResponse,
    CostingPricing,
    CostingPricingCreate,
    CostingPricingListResponse,
)
from app.services.pms_service import (
    list_chemical_types,
    count_chemical_types,
    create_chemical_type,
    list_tds,
    count_tds,
    create_tds,
    get_tds_by_id,
    list_partners,
    count_partners,
    create_partner,
    list_leanchem_products,
    count_leanchem_products,
    create_leanchem_product,
    list_costing_pricing,
    count_costing_pricing,
    create_costing_pricing,
)
from app.dependencies import get_current_user


router = APIRouter()


# =============================
# CHEMICAL TYPES
# =============================


@router.get("/chemicals", response_model=ChemicalTypeListResponse)
async def get_chemical_types(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    # user: dict = Depends(get_current_user),
):
    """List chemical types."""
    try:
        chemicals = list_chemical_types(limit=limit, offset=offset)
        total = count_chemical_types()
        return ChemicalTypeListResponse(chemicals=chemicals, total=total)
    except Exception as e:
        logger.exception("Error fetching chemical types")
        raise HTTPException(status_code=500, detail=f"Error fetching chemical types: {str(e)}")


@router.post("/chemicals", response_model=ChemicalType, status_code=201)
async def create_chemical_type_endpoint(
    body: ChemicalTypeCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new chemical type."""
    try:
        return create_chemical_type(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chemical type: {str(e)}")


# =============================
# TDS DATA
# =============================


@router.get("/tds", response_model=TdsListResponse)
async def get_tds_list(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    brand: Optional[str] = Query(None),
    grade: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    chemical_type_id: Optional[str] = Query(None),
    # user: dict = Depends(get_current_user),
):
    """List TDS records with optional filters (brand, grade, owner, chemical_type_id)."""
    try:
        tds_items = list_tds(
            limit=limit,
            offset=offset,
            brand=brand,
            grade=grade,
            owner=owner,
            chemical_type_id=chemical_type_id,
        )
        total = count_tds()
        return TdsListResponse(tds=tds_items, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching TDS data: {str(e)}")


@router.post("/tds", response_model=Tds, status_code=201)
async def create_tds_endpoint(
    body: TdsCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new TDS record."""
    try:
        return create_tds(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating TDS record: {str(e)}")


@router.get("/tds/{tds_id}", response_model=Tds)
async def get_tds(
    tds_id: str,
    # user: dict = Depends(get_current_user),
):
    """Get a single TDS record by ID."""
    tds = get_tds_by_id(tds_id)
    if not tds:
        raise HTTPException(status_code=404, detail="TDS record not found")
    return tds


# =============================
# PARTNERS
# =============================


@router.get("/partners", response_model=PartnerListResponse)
async def get_partners(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    partner_name: Optional[str] = Query(None),
    # user: dict = Depends(get_current_user),
):
    """List partners with optional name filter."""
    try:
        partners = list_partners(limit=limit, offset=offset, partner_name=partner_name)
        total = count_partners()
        return PartnerListResponse(partners=partners, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching partners: {str(e)}")


@router.post("/partners", response_model=Partner, status_code=201)
async def create_partner_endpoint(
    body: PartnerCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new partner."""
    try:
        return create_partner(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating partner: {str(e)}")


# =============================
# LEANCHEM PRODUCTS
# =============================


@router.get("/products", response_model=LeanchemProductListResponse)
async def get_leanchem_products_endpoint(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    tds_id: Optional[str] = Query(None),
    # user: dict = Depends(get_current_user),
):
    """List LeanChem products with optional filters and pagination."""
    try:
        products = list_leanchem_products(
            limit=limit,
            offset=offset,
            category=category,
            product_type=product_type,
            tds_id=tds_id,
        )
        total = count_leanchem_products()
        return LeanchemProductListResponse(products=products, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


@router.post("/products", response_model=LeanchemProduct, status_code=201)
async def create_leanchem_product_endpoint(
    body: LeanchemProductCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new LeanChem product."""
    try:
        return create_leanchem_product(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


# =============================
# COSTING / PRICING
# =============================


@router.get("/pricing", response_model=CostingPricingListResponse)
async def get_costing_pricing_endpoint(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    partner_id: Optional[str] = Query(None),
    tds_id: Optional[str] = Query(None),
    # user: dict = Depends(get_current_user),
):
    """List costing/pricing rows for a given partner and/or TDS record."""
    try:
        pricing = list_costing_pricing(
            limit=limit,
            offset=offset,
            partner_id=partner_id,
            tds_id=tds_id,
        )
        total = count_costing_pricing()
        return CostingPricingListResponse(pricing=pricing, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pricing data: {str(e)}")


@router.post("/pricing", response_model=CostingPricing, status_code=201)
async def create_costing_pricing_endpoint(
    body: CostingPricingCreate,
    # user: dict = Depends(get_current_user),
):
    """Create a new costing/pricing record."""
    try:
        return create_costing_pricing(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating pricing record: {str(e)}")


 