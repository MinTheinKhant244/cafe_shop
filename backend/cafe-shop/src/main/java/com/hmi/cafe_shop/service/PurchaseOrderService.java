package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.PurchaseOrder;
import java.util.List;
import java.util.Optional;

public interface PurchaseOrderService {
    PurchaseOrder createPO(PurchaseOrder po);
    Optional<PurchaseOrder> getPOById(Long id);
    Optional<PurchaseOrder> getPOByNo(String poNo);
    List<PurchaseOrder> getAllPOs();
    PurchaseOrder updatePOStatus(Long id, String status);
}