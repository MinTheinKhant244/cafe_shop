package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Inventory;

import java.util.List;
import java.util.Optional;

public interface InventoryService {

    List<Inventory> getAll();

    Optional<Inventory> getById(Long id);

    Inventory save(Inventory inventory);

    Inventory update(Long id, Inventory inventory);

    void delete(Long id);

    List<Inventory> getLowStockProducts();
}