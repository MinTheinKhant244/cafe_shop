package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.PurchaseOrderItem;
import java.util.List;

public interface PurchaseOrderItemService {
    PurchaseOrderItem addPOItem(PurchaseOrderItem item);
    List<PurchaseOrderItem> getItemsByPOId(Long poId);
    PurchaseOrderItem updateReceivedQuantity(Long id, Integer qtyReceived);
    void deletePOItem(Long id);
}