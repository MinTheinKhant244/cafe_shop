package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByInventoryIdOrderByTransactionDateDesc(Long inventoryId);
    List<InventoryTransaction> findByTransactionDateBetweenOrderByTransactionDateDesc(LocalDateTime start, LocalDateTime end);
    List<InventoryTransaction> findByTransactionTypeAndTransactionDateBetween(String type, LocalDateTime start, LocalDateTime end);
}