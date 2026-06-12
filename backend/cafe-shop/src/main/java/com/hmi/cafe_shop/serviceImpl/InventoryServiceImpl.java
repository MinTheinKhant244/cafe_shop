// InventoryServiceImpl.java
package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.InventoryPriceHistory;
import com.hmi.cafe_shop.dto.InventoryTransaction;
import com.hmi.cafe_shop.dto.ProductStockStatusDTO;
import com.hmi.cafe_shop.entity.CartItem;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.OrderItem;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.repository.CartItemRepository;
import com.hmi.cafe_shop.repository.InventoryPriceHistoryRepository;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.InventoryTransactionRepository;
import com.hmi.cafe_shop.repository.RecipeRepository;
import com.hmi.cafe_shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

	private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final CartItemRepository cartItemRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final InventoryPriceHistoryRepository priceHistoryRepository;

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
        if (inventory.getUnit() != null && !inventory.getUnit().trim().isEmpty()) {
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
        
        // ⭐ CRITICAL: Update quantity if provided
        if (inventory.getQuantity() != null) {
            if (inventory.getQuantity() < 0) {
                throw new IllegalArgumentException("Quantity cannot be negative");
            }
            existing.setQuantity(inventory.getQuantity());
        }
        
        // ⭐ CRITICAL: Update current price if provided
        if (inventory.getCurrentPrice() != null) {
            if (inventory.getCurrentPrice() < 0) {
                throw new IllegalArgumentException("Price cannot be negative");
            }
            existing.setCurrentPrice(inventory.getCurrentPrice());
        }
        
        return inventoryRepository.save(existing);
    }
    

    @Override
    public void delete(Long id) {
        Inventory inventory = getInventoryOrThrow(id);
        
        // Check if has transactions
        List<InventoryTransaction> transactions = transactionRepository.findByInventoryIdOrderByTransactionDateDesc(id);
        if (!transactions.isEmpty()) {
            throw new IllegalStateException("Cannot delete inventory with transaction history");
        }
        
        inventoryRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Inventory addStock(Long id, Double quantity, Double price, String invoiceNo, String notes, String performedBy) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        if (price < 0) throw new IllegalArgumentException("Price cannot be negative");
        
        Inventory inventory = getInventoryOrThrow(id);
        Double oldQuantity = inventory.getQuantity();
        Double oldPrice = inventory.getCurrentPrice();
        Double newQuantity = oldQuantity + quantity;
        
        // Update inventory
        inventory.setQuantity(newQuantity);
        inventory.setCurrentPrice(price);
        
        // Save transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
            .inventory(inventory)
            .transactionType("PURCHASE")
            .quantityChange(quantity)
            .oldQuantity(oldQuantity)
            .newQuantity(newQuantity)
            .unitPrice(price)
            .referenceId(invoiceNo)
            .notes(notes != null ? notes : "Stock purchase")
            .performedBy(performedBy)
            .build();
        transactionRepository.save(transaction);
        
        // Save price history if price changed
        if (!oldPrice.equals(price)) {
            InventoryPriceHistory priceHistory = InventoryPriceHistory.builder()
                .inventory(inventory)
                .oldPrice(oldPrice)
                .newPrice(price)
                .changeReason("New purchase - Invoice: " + (invoiceNo != null ? invoiceNo : "N/A"))
                .changedBy(performedBy)
                .build();
            priceHistoryRepository.save(priceHistory);
        }
        
        return inventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public Inventory removeStock(Long id, Double quantity, String transactionType, String referenceId, String notes, String performedBy) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        
        Inventory inventory = getInventoryOrThrow(id);
        
        if (inventory.getQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient stock. Available: " + inventory.getQuantity());
        }
        
        Double oldQuantity = inventory.getQuantity();
        Double newQuantity = oldQuantity - quantity;
        
        // Update inventory
        inventory.setQuantity(newQuantity);
        
        // Save transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
            .inventory(inventory)
            .transactionType(transactionType) // USAGE, WASTAGE, RETURN
            .quantityChange(-quantity)
            .oldQuantity(oldQuantity)
            .newQuantity(newQuantity)
            .unitPrice(inventory.getCurrentPrice())
            .referenceId(referenceId)
            .notes(notes != null ? notes : "Stock removed: " + transactionType)
            .performedBy(performedBy)
            .build();
        transactionRepository.save(transaction);
        
        return inventoryRepository.save(inventory);
    }

    @Override
    @Transactional
    public Inventory adjustStock(Long id, Double newQuantity, String reason, String performedBy) {
        if (newQuantity < 0) throw new IllegalArgumentException("Quantity cannot be negative");
        
        Inventory inventory = getInventoryOrThrow(id);
        Double oldQuantity = inventory.getQuantity();
        Double difference = newQuantity - oldQuantity;
        
        inventory.setQuantity(newQuantity);
        
        if (difference != 0) {
            InventoryTransaction transaction = InventoryTransaction.builder()
                .inventory(inventory)
                .transactionType("ADJUSTMENT")
                .quantityChange(difference)
                .oldQuantity(oldQuantity)
                .newQuantity(newQuantity)
                .unitPrice(inventory.getCurrentPrice())
                .notes("Stock adjustment: " + reason)
                .performedBy(performedBy)
                .build();
            transactionRepository.save(transaction);
        }
        
        return inventoryRepository.save(inventory);
    }
    
    @Override
    @Transactional
    public Inventory updateStock(Long id, Integer quantity) {
        // Legacy method - keep for compatibility
        if (quantity == null) throw new IllegalArgumentException("Quantity is required");
        
        double newQuantity = getInventoryOrThrow(id).getQuantity() + quantity;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Insufficient stock");
        }
        
        return adjustStock(id, newQuantity, "Direct stock update", "system");
    }
    
    @Override
    @Transactional(readOnly = true)
    public ProductStockStatusDTO getProductStockStatus(Product product) {

    	List<CartItem> allItems = cartItemRepository.findAll(); 

        Map<Long, Double> totalIngredientNeeded = new HashMap<>();
        
        for (CartItem item : allItems) {
            List<Recipe> recipes = recipeRepository.findByProductId(item.getProduct().getId());
            for (Recipe recipe : recipes) {
                double required = recipe.getQuantity() * item.getQuantity();
                totalIngredientNeeded.put(recipe.getInventory().getId(), 
                    totalIngredientNeeded.getOrDefault(recipe.getInventory().getId(), 0.0) + required);
            }
        }

        List<Recipe> productRecipes = recipeRepository.findByProductId(product.getId());
        double minStock = Double.MAX_VALUE;

        for (Recipe recipe : productRecipes) {
            Inventory inv = recipe.getInventory();
            
            // လက်ကျန် = စုစုပေါင်းရှိသမျှ - (Cart ထဲက တခြားပစ္စည်းတွေအတွက် လိုအပ်ချက် + ဒီပစ္စည်းအတွက် လိုအပ်ချက်)
            double alreadyReserved = totalIngredientNeeded.getOrDefault(inv.getId(), 0.0);
            
            // Available = (Inventory Total - Reserved) / Recipe Ratio
            double availableForThisIngredient = (inv.getQuantity() - alreadyReserved) / recipe.getQuantity();
            minStock = Math.min(minStock, availableForThisIngredient);
        }

        return new ProductStockStatusDTO(
            product.getId(),
            product.getName(),
            Math.max(0, minStock),
            minStock <= 0
        );
    }

    @Override
    public List<Inventory> getLowStockProducts() {
        return inventoryRepository.findLowStockProducts();
    }

    @Override
    public List<Inventory> searchByName(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return inventoryRepository.findAll();
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
    public List<InventoryTransaction> getTransactionHistory(Long inventoryId) {
        return transactionRepository.findByInventoryIdOrderByTransactionDateDesc(inventoryId);
    }

    @Override
    public List<InventoryPriceHistory> getPriceHistory(Long inventoryId) {
        return priceHistoryRepository.findByInventoryIdOrderByChangedAtDesc(inventoryId);
    }

    @Override
    public Double getAveragePurchasePrice(Long inventoryId) {
        Double totalCost = transactionRepository.getTotalPurchaseCost(inventoryId);
        Double totalQuantity = transactionRepository.getTotalPurchasedQuantity(inventoryId);
        
        if (totalQuantity == null || totalQuantity == 0) return 0.0;
        return totalCost / totalQuantity;
    }

    @Override
    public Double getTotalStockValue() {
        List<Inventory> allInventories = inventoryRepository.findAll();
        return allInventories.stream()
            .mapToDouble(i -> i.getQuantity() * i.getCurrentPrice())
            .sum();
    }

    // Helper methods
    private void validateInventory(Inventory inventory) {
        if (inventory.getName() == null || inventory.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Inventory name is required");
        }
        if (inventory.getQuantity() == null || inventory.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity must be greater than or equal to 0");
        }
        if (inventory.getCurrentPrice() == null || inventory.getCurrentPrice() < 0) {
            throw new IllegalArgumentException("Price must be greater than or equal to 0");
        }
    }
    
    private Inventory getInventoryOrThrow(Long id) {
        return inventoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + id));
    }
}