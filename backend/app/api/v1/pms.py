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
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File

logger = logging.getLogger(__name__)

from app.models.pms import (
    ChemicalType,
    ChemicalTypeCreate,
    ChemicalTypeUpdate,
    ChemicalTypeListResponse,
    Tds,
    TdsCreate,
    TdsUpdate,
    TdsListResponse,
    Partner,
    PartnerCreate,
    PartnerUpdate,
    PartnerListResponse,
    LeanchemProduct,
    LeanchemProductCreate,
    LeanchemProductUpdate,
    LeanchemProductListResponse,
    CostingPricing,
    CostingPricingCreate,
    CostingPricingUpdate,
    CostingPricingListResponse,
)
from app.services.pms_service import (
    list_chemical_types,
    count_chemical_types,
    create_chemical_type,
    get_chemical_type_by_id,
    update_chemical_type,
    delete_chemical_type,
    list_tds,
    count_tds,
    create_tds,
    get_tds_by_id,
    update_tds,
    delete_tds,
    list_partners,
    count_partners,
    create_partner,
    get_partner_by_id,
    update_partner,
    delete_partner,
    list_leanchem_products,
    count_leanchem_products,
    create_leanchem_product,
    get_leanchem_product_by_id,
    update_leanchem_product,
    delete_leanchem_product,
    list_costing_pricing,
    count_costing_pricing,
    create_costing_pricing,
    get_costing_pricing_by_ids,
    update_costing_pricing,
    delete_costing_pricing,
    process_tds_file_with_ai,
)
from app.services.file_service import upload_file_to_supabase, ensure_bucket_exists
from app.dependencies import get_current_user
from app.config import settings


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


@router.get("/chemicals/{chemical_id}", response_model=ChemicalType)
async def get_chemical_type(chemical_id: str):
    """Get a single chemical type by ID."""
    chemical = get_chemical_type_by_id(chemical_id)
    if not chemical:
        raise HTTPException(status_code=404, detail="Chemical type not found")
    return chemical


@router.put("/chemicals/{chemical_id}", response_model=ChemicalType)
async def update_chemical_type_endpoint(chemical_id: str, body: ChemicalTypeUpdate):
    """Update a chemical type."""
    try:
        return update_chemical_type(chemical_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating chemical type: {str(e)}")


@router.delete("/chemicals/{chemical_id}", status_code=204)
async def delete_chemical_type_endpoint(chemical_id: str):
    """Delete a chemical type."""
    try:
        delete_chemical_type(chemical_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chemical type: {str(e)}")


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
    """
    Create a new TDS record.
    
    If metadata contains a temp_file_key, the file will be moved from temp location
    to the final location: tds_files/{tds_id}/{filename}
    """
    try:
        # Create TDS record first to get the ID
        # Pydantic's model_dump(mode='json') in create_tds will handle UUID serialization
        tds_record = create_tds(body)
        tds_id = str(tds_record.id)
        
        # Check if there's a temp file to move
        metadata = body.metadata or {}
        temp_file_key = metadata.get("temp_file_key")
        
        if temp_file_key and "tds_files/temp/" in temp_file_key:
            try:
                # Move file from temp to final location
                from app.database.connection import get_supabase_service_client
                from pathlib import Path
                storage_client = get_supabase_service_client()
                
                # Download from temp location
                temp_file = storage_client.storage.from_("product-documents").download(temp_file_key)
                
                # Upload to final location
                from pathlib import Path
                file_ext = Path(temp_file_key).suffix
                final_key = f"tds_files/{tds_id}/{uuid4()}{file_ext}"
                
                import mimetypes
                content_type, _ = mimetypes.guess_type(temp_file_key)
                if not content_type:
                    content_type = "application/octet-stream"
                
                storage_client.storage.from_("product-documents").upload(
                    final_key,
                    temp_file,
                    file_options={"content-type": content_type, "upsert": "false"}
                )
                
                # Delete temp file
                try:
                    storage_client.storage.from_("product-documents").remove([temp_file_key])
                except:
                    pass  # Ignore if deletion fails
                
                # Update metadata with final file URL
                from app.services.pms_service import update_tds
                from app.models.pms import TdsUpdate
                
                supabase_url = settings.SUPABASE_URL.rstrip("/")
                final_file_url = f"{supabase_url}/storage/v1/object/public/product-documents/{final_key}"
                
                updated_metadata = metadata.copy()
                updated_metadata["tds_file_url"] = final_file_url
                updated_metadata["tds_file_key"] = final_key
                updated_metadata.pop("temp_file_key", None)  # Remove temp key
                
                tds_record = update_tds(tds_id, TdsUpdate(metadata=updated_metadata))
            except Exception as e:
                logger.warning(f"Failed to move temp file for TDS {tds_id}: {str(e)}")
                # Continue anyway - file is still accessible at temp location
        
        return tds_record
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


@router.put("/tds/{tds_id}", response_model=Tds)
async def update_tds_endpoint(tds_id: str, body: TdsUpdate):
    """Update a TDS record."""
    try:
        return update_tds(tds_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating TDS record: {str(e)}")


@router.delete("/tds/{tds_id}", status_code=204)
async def delete_tds_endpoint(tds_id: str):
    """Delete a TDS record."""
    try:
        delete_tds(tds_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting TDS record: {str(e)}")


@router.post("/tds/extract-ai")
async def extract_tds_with_ai_endpoint(
    file: UploadFile = File(...),
    # user: dict = Depends(get_current_user),
):
    """
    Extract TDS information from an uploaded file using AI and upload file to product-documents bucket.
    
    Supports PDF, DOCX, XLSX, and TXT files.
    Returns extracted data along with the file URL in the product-documents bucket.
    File is uploaded to a temp location and will be moved to final location when TDS is created.
    """
    try:
        file_content = await file.read()
        
        # Extract TDS information using AI
        extracted_data = process_tds_file_with_ai(
            file_content,
            file.filename or "unknown",
            file.content_type or "application/octet-stream"
        )
        
        # Ensure product-documents bucket exists
        ensure_bucket_exists("product-documents", is_public=True)
        
        # Upload file to temp location in product-documents bucket
        # Will be moved to final location when TDS is created
        from pathlib import Path
        temp_id = str(uuid4())
        file_ext = Path(file.filename or "unknown").suffix
        temp_key = f"tds_files/temp/{temp_id}{file_ext}"
        
        from app.database.connection import get_supabase_service_client
        storage_client = get_supabase_service_client()
        
        import mimetypes
        content_type, _ = mimetypes.guess_type(file.filename or "unknown")
        if not content_type:
            content_type = file.content_type or "application/octet-stream"
        
        storage_client.storage.from_("product-documents").upload(
            temp_key,
            file_content,
            file_options={"content-type": content_type, "upsert": "false"}
        )
        
        # Construct public URL
        supabase_url = settings.SUPABASE_URL.rstrip("/")
        file_url = f"{supabase_url}/storage/v1/object/public/product-documents/{temp_key}"
        
        # Add file info to extracted data
        extracted_data["file_url"] = file_url
        extracted_data["file_name"] = file.filename
        extracted_data["file_size"] = len(file_content)
        extracted_data["file_content_type"] = content_type
        extracted_data["temp_file_key"] = temp_key  # For moving later
        
        return extracted_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error extracting TDS with AI")
        raise HTTPException(status_code=500, detail=f"Error extracting TDS information: {str(e)}")


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


@router.get("/partners/{partner_id}", response_model=Partner)
async def get_partner(partner_id: str):
    """Get a single partner by ID."""
    partner = get_partner_by_id(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.put("/partners/{partner_id}", response_model=Partner)
async def update_partner_endpoint(partner_id: str, body: PartnerUpdate):
    """Update a partner."""
    try:
        return update_partner(partner_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating partner: {str(e)}")


@router.delete("/partners/{partner_id}", status_code=204)
async def delete_partner_endpoint(partner_id: str):
    """Delete a partner."""
    try:
        delete_partner(partner_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting partner: {str(e)}")


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


@router.get("/products/{product_id}", response_model=LeanchemProduct)
async def get_leanchem_product(product_id: str):
    """Get a single product by ID."""
    product = get_leanchem_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=LeanchemProduct)
async def update_leanchem_product_endpoint(product_id: str, body: LeanchemProductUpdate):
    """Update a LeanChem product."""
    try:
        return update_leanchem_product(product_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


@router.delete("/products/{product_id}", status_code=204)
async def delete_leanchem_product_endpoint(product_id: str):
    """Delete a LeanChem product."""
    try:
        delete_leanchem_product(product_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")


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


@router.get("/pricing/{partner_id}/{tds_id}", response_model=CostingPricing)
async def get_costing_pricing(partner_id: str, tds_id: str):
    """Get a single pricing record by partner and TDS IDs."""
    pricing = get_costing_pricing_by_ids(partner_id, tds_id)
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing record not found")
    return pricing


@router.put("/pricing/{partner_id}/{tds_id}", response_model=CostingPricing)
async def update_costing_pricing_endpoint(
    partner_id: str, tds_id: str, body: CostingPricingUpdate
):
    """Update a pricing record."""
    try:
        return update_costing_pricing(partner_id, tds_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating pricing record: {str(e)}")


@router.delete("/pricing/{partner_id}/{tds_id}", status_code=204)
async def delete_costing_pricing_endpoint(partner_id: str, tds_id: str):
    """Delete a pricing record."""
    try:
        delete_costing_pricing(partner_id, tds_id)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting pricing record: {str(e)}")


 