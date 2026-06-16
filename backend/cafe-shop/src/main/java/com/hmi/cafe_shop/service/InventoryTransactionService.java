package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.dto.StockTransactionRequest;
import com.hmi.cafe_shop.entity.InventoryTransaction;
import java.time.LocalDateTime;
import java.util.List;

public interface InventoryTransactionService {
    
    InventoryTransaction stockIn(StockTransactionRequest request);
    
    InventoryTransaction stockOut(StockTransactionRequest request);
    
    InventoryTransaction adjustStock(StockTransactionRequest request);
    
    List<InventoryTransaction> getTransactionsByInventory(Long inventoryId);
    
    List<InventoryTransaction> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end);
}