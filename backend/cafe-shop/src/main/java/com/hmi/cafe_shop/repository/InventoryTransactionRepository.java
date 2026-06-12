// InventoryTransactionRepository.java
package com.hmi.cafe_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hmi.cafe_shop.dto.InventoryTransaction;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    
    List<InventoryTransaction> findByInventoryIdOrderByTransactionDateDesc(Long inventoryId);
    
    List<InventoryTransaction> findByInventoryIdAndTransactionType(Long inventoryId, String transactionType);
    
    @Query("SELECT t FROM InventoryTransaction t WHERE t.transactionDate BETWEEN :startDate AND :endDate")
    List<InventoryTransaction> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COALESCE(SUM(t.quantityChange * t.unitPrice), 0) FROM InventoryTransaction t WHERE t.inventory.id = :inventoryId AND t.transactionType = 'PURCHASE'")
    Double getTotalPurchaseCost(@Param("inventoryId") Long inventoryId);
    
    @Query("SELECT COALESCE(SUM(t.quantityChange), 0) FROM InventoryTransaction t WHERE t.inventory.id = :inventoryId AND t.transactionType = 'PURCHASE'")
    Double getTotalPurchasedQuantity(@Param("inventoryId") Long inventoryId);
}

