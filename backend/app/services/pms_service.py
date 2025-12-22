"""
PMS Service - Business Logic Layer
==================================

This file contains the "business logic" for Product Management System (PMS)
operations on top of Supabase:
- chemical_types
- tds_data
- partner_data
- leanchem_products
- costing_pricing_data
"""

from typing import List, Optional
import json

from supabase import Client

from app.database.connection import get_supabase_client
from app.models.pms import (
    ChemicalType,
    ChemicalTypeCreate,
    Tds,
    TdsCreate,
    Partner,
    PartnerCreate,
    LeanchemProduct,
    LeanchemProductCreate,
    CostingPricing,
    CostingPricingCreate,
)


# =============================
# CHEMICAL TYPES
# =============================


def list_chemical_types(limit: int = 100, offset: int = 0) -> List[ChemicalType]:
    """
    Return chemical_types, normalising JSONB fields that may be stored as strings.

    Some existing rows have spec_template (and potentially metadata)
    saved as a JSON string instead of a JSON object, which breaks Pydantic's
    Dict[str, Any] validation. Here we gently json.loads() those strings.
    """
    supabase: Client = get_supabase_client()
    try:
        response = (
            supabase.table("chemical_types")
            .select("*")
            .order("name", desc=False)
            .limit(limit)
            .offset(offset)
            .execute()
        )

        # Check for Supabase API errors
        if hasattr(response, "error") and response.error:
            raise RuntimeError(
                f"Supabase error listing chemical_types: {response.error}"
            )

        if response.data is None:
            return []

        normalised_rows = []
        for row in response.data:
            row = dict(row)  # make a shallow copy we can mutate

            # Normalise spec_template if Supabase returns it as a JSON string
            spec_val = row.get("spec_template")
            if isinstance(spec_val, str):
                try:
                    row["spec_template"] = json.loads(spec_val)
                except Exception:
                    # If it fails to parse, fall back to empty dict
                    row["spec_template"] = {}

            # Normalise metadata similarly (defensive)
            meta_val = row.get("metadata")
            if isinstance(meta_val, str):
                try:
                    row["metadata"] = json.loads(meta_val)
                except Exception:
                    row["metadata"] = {}

            normalised_rows.append(row)

        return [ChemicalType(**row) for row in normalised_rows]
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        raise RuntimeError(
            f"Error fetching chemical_types ({error_type}): {error_msg}"
        ) from e


def count_chemical_types() -> int:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("chemical_types")
        .select("id", count="exact")
        .execute()
    )
    return response.count or 0


def create_chemical_type(body: ChemicalTypeCreate) -> ChemicalType:
    supabase: Client = get_supabase_client()
    payload = body.model_dump(exclude_unset=True)
    response = supabase.table("chemical_types").insert(payload).execute()
    if not response.data:
        raise RuntimeError("Failed to create chemical type")
    return ChemicalType(**response.data[0])


# =============================
# TDS DATA
# =============================


def list_tds(
    limit: int = 100,
    offset: int = 0,
    brand: Optional[str] = None,
    grade: Optional[str] = None,
    owner: Optional[str] = None,
    chemical_type_id: Optional[str] = None,
) -> List[Tds]:
    supabase: Client = get_supabase_client()
    query = supabase.table("tds_data").select("*")

    if brand:
        query = query.ilike("brand", f"%{brand}%")
    if grade:
        query = query.ilike("grade", f"%{grade}%")
    if owner:
        query = query.ilike("owner", f"%{owner}%")
    if chemical_type_id:
        query = query.eq("chemical_type_id", chemical_type_id)

    response = (
        query.order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return [Tds(**row) for row in (response.data or [])]


def count_tds() -> int:
    supabase: Client = get_supabase_client()
    response = supabase.table("tds_data").select("id", count="exact").execute()
    return response.count or 0


def create_tds(body: TdsCreate) -> Tds:
    supabase: Client = get_supabase_client()
    payload = body.model_dump(exclude_unset=True)
    response = supabase.table("tds_data").insert(payload).execute()
    if not response.data:
        raise RuntimeError("Failed to create TDS record")
    return Tds(**response.data[0])


def get_tds_by_id(tds_id: str) -> Optional[Tds]:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("tds_data")
        .select("*")
        .eq("id", tds_id)
        .single()
        .execute()
    )
    if response.data:
        return Tds(**response.data)
    return None


# =============================
# PARTNER DATA
# =============================


def list_partners(
    limit: int = 100,
    offset: int = 0,
    partner_name: Optional[str] = None,
) -> List[Partner]:
    supabase: Client = get_supabase_client()
    query = supabase.table("partner_data").select("*")
    if partner_name:
        query = query.ilike("partner", f"%{partner_name}%")
    response = (
        query.order("partner", desc=False)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return [Partner(**row) for row in (response.data or [])]


def count_partners() -> int:
    supabase: Client = get_supabase_client()
    response = supabase.table("partner_data").select("id", count="exact").execute()
    return response.count or 0


def create_partner(body: PartnerCreate) -> Partner:
    supabase: Client = get_supabase_client()
    payload = body.model_dump(exclude_unset=True)
    response = supabase.table("partner_data").insert(payload).execute()
    if not response.data:
        raise RuntimeError("Failed to create partner")
    return Partner(**response.data[0])


# =============================
# LEANCHEM PRODUCTS
# =============================


def list_leanchem_products(
    limit: int = 100,
    offset: int = 0,
    category: Optional[str] = None,
    product_type: Optional[str] = None,
    tds_id: Optional[str] = None,
) -> List[LeanchemProduct]:
    supabase: Client = get_supabase_client()
    query = supabase.table("leanchem_products").select("*")

    if category:
        query = query.ilike("category", f"%{category}%")
    if product_type:
        query = query.ilike("product_type", f"%{product_type}%")
    if tds_id:
        query = query.eq("tds_id", tds_id)

    response = (
        query.order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return [LeanchemProduct(**row) for row in (response.data or [])]


def count_leanchem_products() -> int:
    supabase: Client = get_supabase_client()
    response = supabase.table("leanchem_products").select("id", count="exact").execute()
    return response.count or 0


def create_leanchem_product(body: LeanchemProductCreate) -> LeanchemProduct:
    supabase: Client = get_supabase_client()
    payload = body.model_dump(exclude_unset=True)
    response = supabase.table("leanchem_products").insert(payload).execute()
    if not response.data:
        raise RuntimeError("Failed to create LeanChem product")
    return LeanchemProduct(**response.data[0])


# =============================
# COSTING / PRICING DATA
# =============================


def list_costing_pricing(
    limit: int = 100,
    offset: int = 0,
    partner_id: Optional[str] = None,
    tds_id: Optional[str] = None,
) -> List[CostingPricing]:
    supabase: Client = get_supabase_client()
    query = supabase.table("costing_pricing_data").select("*")

    if partner_id:
        query = query.eq("partner_id", partner_id)
    if tds_id:
        query = query.eq("tds_id", tds_id)

    response = (
        query.order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return [CostingPricing(**row) for row in (response.data or [])]


def count_costing_pricing() -> int:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("costing_pricing_data")
        .select("partner_id", count="exact")
        .execute()
    )
    return response.count or 0


def create_costing_pricing(body: CostingPricingCreate) -> CostingPricing:
    supabase: Client = get_supabase_client()
    payload = body.model_dump(exclude_unset=True)
    response = supabase.table("costing_pricing_data").insert(payload).execute()
    if not response.data:
        raise RuntimeError("Failed to create costing/pricing record")
    return CostingPricing(**response.data[0])


 # =============================
 # HELPER FUNCTIONS
 # =============================
 
 
def get_all_categories() -> List[str]:
     """
     Fetch all unique, non-empty categories from the `chemical_types` table.
 
     This is used by the CRM module when building AI customer profiles so that
     the Strategic-Fit Matrix is always aligned with the actual product
     taxonomy defined in PMS, instead of hard-coding category names.
     """
     supabase: Client = get_supabase_client()
     try:
         response = supabase.table("chemical_types").select("category").execute()
         categories_set = set()
         for row in response.data or []:
             cat = (row.get("category") or "").strip()
             if cat:
                 categories_set.add(cat)
         return sorted(list(categories_set))
     except Exception:
         # Safe fallback to the original default categories used in the MVP
         return ["Cement", "Dry-Mix", "Admixtures", "Paint & Coatings"]
