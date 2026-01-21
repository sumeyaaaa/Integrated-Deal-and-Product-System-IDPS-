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

from typing import List, Optional, Dict, Any
import json
import re

from supabase import Client

from app.database.connection import get_supabase_client
from app.services.ai_service import gemini_chat
from app.services.file_service import extract_text_from_file
from app.models.pms import (
    ChemicalType,
    ChemicalTypeCreate,
    ChemicalTypeUpdate,
    Tds,
    TdsCreate,
    TdsUpdate,
    Partner,
    PartnerCreate,
    PartnerUpdate,
    LeanchemProduct,
    LeanchemProductCreate,
    LeanchemProductUpdate,
    CostingPricing,
    CostingPricingCreate,
    CostingPricingUpdate,
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


def get_chemical_type_by_id(chemical_id: str) -> Optional[ChemicalType]:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("chemical_types")
        .select("*")
        .eq("id", chemical_id)
        .single()
        .execute()
    )
    if response.data:
        row = dict(response.data)
        # Normalize JSONB fields
        if isinstance(row.get("spec_template"), str):
            try:
                import json
                row["spec_template"] = json.loads(row["spec_template"])
            except Exception:
                row["spec_template"] = {}
        if isinstance(row.get("metadata"), str):
            try:
                import json
                row["metadata"] = json.loads(row["metadata"])
            except Exception:
                row["metadata"] = {}
        return ChemicalType(**row)
    return None


def update_chemical_type(chemical_id: str, body: ChemicalTypeUpdate) -> ChemicalType:
    supabase: Client = get_supabase_client()
    existing = get_chemical_type_by_id(chemical_id)
    if not existing:
        raise ValueError("Chemical type not found")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing
    
    response = (
        supabase.table("chemical_types")
        .update(update_data)
        .eq("id", chemical_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("Failed to update chemical type")
    
    row = dict(response.data[0])
    # Normalize JSONB fields
    if isinstance(row.get("spec_template"), str):
        try:
            import json
            row["spec_template"] = json.loads(row["spec_template"])
        except Exception:
            row["spec_template"] = {}
    if isinstance(row.get("metadata"), str):
        try:
            import json
            row["metadata"] = json.loads(row["metadata"])
        except Exception:
            row["metadata"] = {}
    return ChemicalType(**row)


def delete_chemical_type(chemical_id: str) -> bool:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("chemical_types")
        .delete()
        .eq("id", chemical_id)
        .execute()
    )
    return True


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
    
    # Convert ALL UUIDs in the entire payload to strings (Supabase needs strings)
    from uuid import UUID
    def convert_uuids(obj):
        """Recursively convert UUID objects to strings for JSON serialization."""
        if isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, dict):
            return {k: convert_uuids(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_uuids(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(convert_uuids(item) for item in obj)
        return obj
    
    # Convert all UUIDs in the entire payload
    payload = convert_uuids(payload)
    
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


def update_tds(tds_id: str, body: TdsUpdate) -> Tds:
    supabase: Client = get_supabase_client()
    existing = get_tds_by_id(tds_id)
    if not existing:
        raise ValueError("TDS record not found")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing
    
    # Convert ALL UUIDs in the update data to strings
    from uuid import UUID
    def convert_uuids(obj):
        """Recursively convert UUID objects to strings for JSON serialization."""
        if isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, dict):
            return {k: convert_uuids(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_uuids(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(convert_uuids(item) for item in obj)
        return obj
    
    update_data = convert_uuids(update_data)
    
    response = (
        supabase.table("tds_data")
        .update(update_data)
        .eq("id", tds_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("Failed to update TDS record")
    return Tds(**response.data[0])


def delete_tds(tds_id: str) -> bool:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("tds_data")
        .delete()
        .eq("id", tds_id)
        .execute()
    )
    return True


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


def get_partner_by_id(partner_id: str) -> Optional[Partner]:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("partner_data")
        .select("*")
        .eq("id", partner_id)
        .single()
        .execute()
    )
    if response.data:
        return Partner(**response.data)
    return None


def update_partner(partner_id: str, body: PartnerUpdate) -> Partner:
    supabase: Client = get_supabase_client()
    existing = get_partner_by_id(partner_id)
    if not existing:
        raise ValueError("Partner not found")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing
    
    response = (
        supabase.table("partner_data")
        .update(update_data)
        .eq("id", partner_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("Failed to update partner")
    return Partner(**response.data[0])


def delete_partner(partner_id: str) -> bool:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("partner_data")
        .delete()
        .eq("id", partner_id)
        .execute()
    )
    return True


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


def get_leanchem_product_by_id(product_id: str) -> Optional[LeanchemProduct]:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("leanchem_products")
        .select("*")
        .eq("id", product_id)
        .single()
        .execute()
    )
    if response.data:
        return LeanchemProduct(**response.data)
    return None


def update_leanchem_product(product_id: str, body: LeanchemProductUpdate) -> LeanchemProduct:
    supabase: Client = get_supabase_client()
    existing = get_leanchem_product_by_id(product_id)
    if not existing:
        raise ValueError("Product not found")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing
    
    response = (
        supabase.table("leanchem_products")
        .update(update_data)
        .eq("id", product_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("Failed to update product")
    return LeanchemProduct(**response.data[0])


def delete_leanchem_product(product_id: str) -> bool:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("leanchem_products")
        .delete()
        .eq("id", product_id)
        .execute()
    )
    return True


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


def get_costing_pricing_by_ids(partner_id: str, tds_id: str) -> Optional[CostingPricing]:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("costing_pricing_data")
        .select("*")
        .eq("partner_id", partner_id)
        .eq("tds_id", tds_id)
        .single()
        .execute()
    )
    if response.data:
        return CostingPricing(**response.data)
    return None


def update_costing_pricing(partner_id: str, tds_id: str, body: CostingPricingUpdate) -> CostingPricing:
    supabase: Client = get_supabase_client()
    existing = get_costing_pricing_by_ids(partner_id, tds_id)
    if not existing:
        raise ValueError("Pricing record not found")
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return existing
    
    response = (
        supabase.table("costing_pricing_data")
        .update(update_data)
        .eq("partner_id", partner_id)
        .eq("tds_id", tds_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("Failed to update pricing record")
    return CostingPricing(**response.data[0])


def delete_costing_pricing(partner_id: str, tds_id: str) -> bool:
    supabase: Client = get_supabase_client()
    response = (
        supabase.table("costing_pricing_data")
        .delete()
        .eq("partner_id", partner_id)
        .eq("tds_id", tds_id)
        .execute()
    )
    return True


 # =============================
 # AI FUNCTIONS FOR TDS EXTRACTION
 # =============================


def _parse_lenient_json(text: str) -> Optional[Dict[str, Any]]:
    """Try to parse JSON from text, handling various formats."""
    if not text:
        return None
    
    # Try direct JSON parse
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # Try to extract JSON object from text
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except Exception:
            pass
    
    return None


def extract_tds_info_with_ai(text_content: str) -> Optional[Dict[str, Any]]:
    """
    Use Gemini AI to extract TDS information from text content.
    
    Returns a dictionary with extracted fields:
    - generic_product_name
    - trade_name
    - supplier_name
    - packaging_size_type
    - net_weight
    - hs_code
    - technical_specification
    """
    try:
        prompt = f"""
Extract the following information from this Technical Data Sheet (TDS) text. 
Return the information in a structured JSON format. If any information is not found, use empty string.

Text content:
{text_content[:10000]}  # Limit to avoid token limits

Please extract and return ONLY a JSON object with these exact keys:
{{
    "generic_product_name": "[extract generic product name]",
    "trade_name": "[extract trade name or model name]",
    "supplier_name": "[extract supplier or manufacturer name]",
    "packaging_size_type": "[extract packaging information]",
    "net_weight": "[extract net weight]",
    "hs_code": "[extract HS code]",
    "technical_specification": "[extract key technical specifications]"
}}

Return ONLY valid JSON, no other text.
"""
        
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that extracts structured data from Technical Data Sheets. Always return valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        response_text = gemini_chat(messages)
        
        if not response_text:
            return None
        
        # Try to parse JSON from response
        parsed_json = _parse_lenient_json(response_text)
        if isinstance(parsed_json, dict):
            return parsed_json
        
        # Fallback: parse "Key: Value" lines
        extracted_info = {}
        lines = response_text.split('\n')
        for line in lines:
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip().lower().replace(' ', '_').replace('-', '_')
                    value = parts[1].strip()
                    if key and value and value.lower() != "not found":
                        extracted_info[key] = value
        
        return extracted_info if extracted_info else None
        
    except Exception as e:
        print(f"AI extraction error: {str(e)}")
        return None


def process_tds_file_with_ai(file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
    """
    Process a TDS file with AI to extract information.
    
    Args:
        file_content: File content as bytes
        filename: Original filename
        content_type: MIME type of the file
    
    Returns:
        Dictionary with extracted TDS information
    """
    # Extract text from file
    text_content = extract_text_from_file(file_content, filename, content_type)
    
    if not text_content or text_content.startswith("[Error") or text_content.startswith("[File type"):
        raise ValueError(f"Could not extract text from file: {text_content}")
    
    # Extract information using AI
    extracted_info = extract_tds_info_with_ai(text_content)
    
    if not extracted_info:
        # Last resort: try to parse simple key: value lines
        guess = {}
        for line in text_content.splitlines():
            if ":" in line and len(line) < 200:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    k = parts[0].strip().lower().replace(' ', '_')
                    v = parts[1].strip()
                    if k and v:
                        guess[k] = v
        if guess:
            extracted_info = guess
    
    if not extracted_info:
        raise ValueError("AI extraction failed. Please check your file.")
    
    # Normalize keys to match our expected format
    normalized = {}
    key_mapping = {
        "generic_product_name": ["generic_product_name", "generic product name", "product_name", "product name"],
        "trade_name": ["trade_name", "trade name", "model_name", "model name", "brand_name", "brand name"],
        "supplier_name": ["supplier_name", "supplier name", "manufacturer", "manufacturer_name"],
        "packaging_size_type": ["packaging_size_type", "packaging size & type", "packaging", "packaging_size"],
        "net_weight": ["net_weight", "net weight", "weight"],
        "hs_code": ["hs_code", "hs code", "hscode", "harmonized_system_code"],
        "technical_specification": ["technical_specification", "technical specification", "specification", "specs"]
    }
    
    for target_key, possible_keys in key_mapping.items():
        for possible_key in possible_keys:
            if possible_key in extracted_info:
                normalized[target_key] = extracted_info[possible_key]
                break
    
    return normalized


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
 