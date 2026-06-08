package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Inventory;
import java.util.List;
import java.util.Optional;

public interface InventoryService {
    List<Inventory> getAllInventoryStatus();
    Optional<Inventory> getInventoryByProductId(Long productId);
    List<Inventory> getLowStockProducts(); 
}