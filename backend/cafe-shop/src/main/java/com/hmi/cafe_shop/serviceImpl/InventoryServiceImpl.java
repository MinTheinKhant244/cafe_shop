package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;

    @Override
    public List<Inventory> getAll() {
        return inventoryRepository.findAll();
    }

    @Override
    public Optional<Inventory> getById(Long id) {
        return inventoryRepository.findById(id);
    }

    @Override
    public Inventory save(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    @Override
    public Inventory update(Long id, Inventory inventory) {

        Inventory existing = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        existing.setName(inventory.getName());
        existing.setUnit(inventory.getUnit());
        existing.setQuantity(inventory.getQuantity());
        existing.setLowStockThreshold(inventory.getLowStockThreshold());

        return inventoryRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        inventoryRepository.deleteById(id);
    }

    @Override
    public List<Inventory> getLowStockProducts() {
        return inventoryRepository.findLowStockProducts();
    }
}