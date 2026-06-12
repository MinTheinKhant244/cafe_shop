package com.hmi.cafe_shop.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hmi.cafe_shop.dto.InventoryPriceHistory;

import java.util.List;

public interface InventoryPriceHistoryRepository extends JpaRepository<InventoryPriceHistory, Long> {
    List<InventoryPriceHistory> findByInventoryIdOrderByChangedAtDesc(Long inventoryId);
}