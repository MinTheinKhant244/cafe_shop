package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
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
        validateInventory(inventory);
        
        if (inventoryRepository.existsByName(inventory.getName())) {
            throw new IllegalArgumentException("Inventory item with name '" + inventory.getName() + "' already exists");
        }
        
        // Set default status
        inventory.setStatus("ACTIVE");
        inventory.setQuantity(0.0); 
        
        return inventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public Inventory update(Long id, Inventory inventory) {
        Inventory existing = getInventoryOrThrow(id);
        
        // Update name with duplicate check
        if (inventory.getName() != null && !inventory.getName().trim().isEmpty()) {
            if (!existing.getName().equals(inventory.getName()) && 
                inventoryRepository.existsByName(inventory.getName())) {
                throw new IllegalArgumentException("Inventory item with name '" + inventory.getName() + "' already exists");
            }
            existing.setName(inventory.getName());
        }
        
        // Update unit
        if (inventory.getUnit() != null) {
            existing.setUnit(inventory.getUnit());
        }
        
        // Update low stock threshold
        if (inventory.getLowStockThreshold() != null) {
            if (inventory.getLowStockThreshold() < 0) {
                throw new IllegalArgumentException("Low stock threshold cannot be negative");
            }
            existing.setLowStockThreshold(inventory.getLowStockThreshold());
        }
        
        // Update status
        if (inventory.getStatus() != null) {
            String status = inventory.getStatus().toUpperCase();
            if (status.equals("ACTIVE") || status.equals("INACTIVE") || status.equals("DISCONTINUED")) {
                existing.setStatus(status);
            } else {
                throw new IllegalArgumentException("Invalid status. Allowed: ACTIVE, INACTIVE, DISCONTINUED");
            }
        }
        
        // ❌ REMOVED: Do NOT update quantity here! Use transactions instead
        // Quantity should only be updated via Stock In/Out transactions
        
        // Update current price if provided
        if (inventory.getCurrentPrice() != null) {
            if (inventory.getCurrentPrice() < 0) {
                throw new IllegalArgumentException("Price cannot be negative");
            }
            existing.setCurrentPrice(inventory.getCurrentPrice());
        }
        
        return inventoryRepository.save(existing);
    }
    
    @Override
    @Transactional
    public Inventory deactivate(Long id) {
        Inventory inventory = getInventoryOrThrow(id);
        
        inventory.setStatus("INACTIVE");
        inventory.setDeactivatedAt(LocalDateTime.now());
        inventory.setDeactivatedBy(getCurrentUser());
        
        return inventoryRepository.save(inventory);
    }
    
    @Override
    @Transactional
    public Inventory activate(Long id) {
        Inventory inventory = getInventoryOrThrow(id);
        
        inventory.setStatus("ACTIVE");
        inventory.setDeactivatedAt(null);
        inventory.setDeactivatedBy(null);
        
        return inventoryRepository.save(inventory);
    }
    
    @Override
    public List<Inventory> getActiveOnly() {
        return inventoryRepository.findByStatus("ACTIVE");
    }
    
    @Override
    public List<Inventory> getInactiveOnly() {
        return inventoryRepository.findByStatus("INACTIVE");
    }

    @Override
    public void delete(Long id) {
        Inventory inventory = getInventoryOrThrow(id);
        
        if (inventory.getTransactions() != null && !inventory.getTransactions().isEmpty()) {
            throw new RuntimeException("Cannot delete inventory with existing transactions. Use deactivate instead.");
        }
        
        inventoryRepository.deleteById(id);
    }

    @Override
    public List<Inventory> getLowStockProducts() {
        return inventoryRepository.findLowStockProducts();
    }

    @Override
    public List<Inventory> searchByName(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return inventoryRepository.findByStatus("ACTIVE");
        }
        return inventoryRepository.searchByName(keyword);
    }

    @Override
    public Optional<Inventory> findByName(String name) {
        return inventoryRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return inventoryRepository.existsByName(name);
    }

    @Override
    public List<Inventory> getProductsBelowQuantity(Double threshold) {
        if (threshold == null || threshold < 0) {
            throw new IllegalArgumentException("Threshold must be greater than or equal to 0");
        }
        return inventoryRepository.findProductsBelowQuantity(threshold);
    }

    @Override
    public Double getTotalStockValue() {
        List<Inventory> activeItems = inventoryRepository.findByStatus("ACTIVE");
        return activeItems.stream()
            .mapToDouble(i -> (i.getQuantity() != null ? i.getQuantity() : 0) * 
                              (i.getCurrentPrice() != null ? i.getCurrentPrice() : 0))
            .sum();
    }

    // Helper methods
    private void validateInventory(Inventory inventory) {
        if (inventory.getName() == null || inventory.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Inventory name is required");
        }
        if (inventory.getCurrentPrice() == null || inventory.getCurrentPrice() < 0) {
            throw new IllegalArgumentException("Price must be greater than or equal to 0");
        }
    }
    
    private Inventory getInventoryOrThrow(Long id) {
        return inventoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + id));
    }
    
    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}