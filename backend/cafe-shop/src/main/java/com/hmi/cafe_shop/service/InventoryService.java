// InventoryService.java
package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Product;
import java.util.List;
import java.util.Optional;

public interface InventoryService {

    // Basic CRUD
    List<Inventory> getAll();
    Optional<Inventory> getById(Long id);
    Inventory save(Inventory inventory);
    Inventory update(Long id, Inventory inventory);
    void delete(Long id);
    
    // Queries
    List<Inventory> getLowStockProducts();
    List<Inventory> searchByName(String keyword);
    Optional<Inventory> findByName(String name);
    boolean existsByName(String name);
    List<Inventory> getProductsBelowQuantity(Double threshold);
    
    // History & Reports
    Double getTotalStockValue();
}