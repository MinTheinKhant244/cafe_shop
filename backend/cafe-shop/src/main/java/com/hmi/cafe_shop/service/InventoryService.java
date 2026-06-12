// InventoryService.java
package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.dto.InventoryPriceHistory;
import com.hmi.cafe_shop.dto.InventoryTransaction;
import com.hmi.cafe_shop.entity.Inventory;

import java.util.List;
import java.util.Optional;

public interface InventoryService {

    // Basic CRUD
    List<Inventory> getAll();
    Optional<Inventory> getById(Long id);
    Inventory save(Inventory inventory);
    Inventory update(Long id, Inventory inventory);
    void delete(Long id);
    
    // Stock Operations (Enhanced)
    Inventory addStock(Long id, Double quantity, Double price, String invoiceNo, String notes, String performedBy);
    Inventory removeStock(Long id, Double quantity, String transactionType, String referenceId, String notes, String performedBy);
    Inventory adjustStock(Long id, Double newQuantity, String reason, String performedBy);
    
    // Stock Management (Legacy - keep for compatibility)
    Inventory updateStock(Long id, Integer quantity);
    
    // Queries
    List<Inventory> getLowStockProducts();
    List<Inventory> searchByName(String keyword);
    Optional<Inventory> findByName(String name);
    boolean existsByName(String name);
    List<Inventory> getProductsBelowQuantity(Double threshold);
    
    // History & Reports
    List<InventoryTransaction> getTransactionHistory(Long inventoryId);
    List<InventoryPriceHistory> getPriceHistory(Long inventoryId);
    Double getAveragePurchasePrice(Long inventoryId);
    Double getTotalStockValue();
}