package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.CartItemRequest;
import com.hmi.cafe_shop.dto.IngredientLimit;
import com.hmi.cafe_shop.dto.ProductStockResponse;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.repository.RecipeRepository;
import com.hmi.cafe_shop.service.ProductStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductStockServiceImpl implements ProductStockService {

    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    private static final int UNLIMITED_QUANTITY = 999;

    @Override
    @Transactional(readOnly = true)
    public ProductStockResponse calculateProductStock(Long productId, List<CartItemRequest> cartItems) {
        log.debug("Calculating stock for productId: {} with cart items: {}", productId, cartItems);
        
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        List<Recipe> recipes = recipeRepository.findByProductIdWithInventory(productId);
        
        // Product without recipes (no ingredients needed)
        if (recipes.isEmpty()) {
            log.debug("Product {} has no recipes, treating as unlimited", productId);
            return buildUnlimitedStockResponse(product);
        }

        // Get current inventory stock for required ingredients
        Map<Long, Double> inventoryStock = getCurrentInventoryStock(recipes);
        
        // FIX: Calculate reserved stock from OTHER products only (excluding current product)
        Map<Long, Double> reservedStock = calculateReservedStockFromCartItemsExcludingProduct(cartItems, productId);
        
        // 🔥 FIX: Also include current product's own reserved stock? NO!
        // For available quantity calculation, we want: 
        // available = for each ingredient: (currentStock - reservedFromOthers) / requiredPerUnit
        // This tells us how many MORE of this product can be added
        
        int availableQuantity = calculateAvailableQuantityWithReservation(recipes, inventoryStock, reservedStock);
        
        // Get detailed breakdown of each ingredient
        List<IngredientLimit> ingredientLimits = getIngredientLimitsWithReservation(recipes, inventoryStock, reservedStock);
        
        boolean isOutOfStock = availableQuantity <= 0;
        boolean isLowStock = availableQuantity > 0 && availableQuantity <= 5;
        
        log.debug("Product {} available quantity (more can be added): {}, out of stock: {}, low stock: {}", 
            productId, availableQuantity, isOutOfStock, isLowStock);
        
        return ProductStockResponse.builder()
            .productId(productId)
            .productName(product.getName())
            .availableQuantity(availableQuantity)
            .maxPossibleQuantity(availableQuantity)
            .isLimitedByInventory(true)
            .isOutOfStock(isOutOfStock)
            .isLowStock(isLowStock)
            .ingredientLimits(ingredientLimits)
            .warningMessage(generateWarningMessage(ingredientLimits, availableQuantity))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, ProductStockResponse> calculateBatchStock(List<Long> productIds, List<CartItemRequest> cartItems) {
        log.debug("Calculating batch stock for {} products with cart items", productIds.size());
        
        Map<Long, ProductStockResponse> results = new HashMap<>();
        
        if (productIds == null || productIds.isEmpty()) {
            return results;
        }
        
        // Fetch all recipes in one query for better performance
        List<Recipe> allRecipes = recipeRepository.findByProductIdInWithInventory(productIds);
        Map<Long, List<Recipe>> recipesByProduct = allRecipes.stream()
            .collect(Collectors.groupingBy(r -> r.getProduct().getId()));
        
        // Get all unique inventory IDs needed
        Set<Long> inventoryIds = allRecipes.stream()
            .map(r -> r.getInventory().getId())
            .collect(Collectors.toSet());
        
        // Get current inventory stocks for all required ingredients
        Map<Long, Double> currentStocks = getCurrentInventoryStocksByIds(inventoryIds);
        
        // 🔥 For each product, calculate reserved from OTHER products only
        for (Long productId : productIds) {
            List<Recipe> productRecipes = recipesByProduct.getOrDefault(productId, new ArrayList<>());
            
            if (productRecipes.isEmpty()) {
                // Product without ingredients
                productRepository.findById(productId).ifPresent(product -> 
                    results.put(productId, buildUnlimitedStockResponse(product))
                );
                continue;
            }
            
            // 🔥 Calculate reserved from OTHER products only (excluding current product)
            Map<Long, Double> reservedFromOthers = calculateReservedStockFromCartItemsExcludingProduct(cartItems, productId);
            
            Product product = productRecipes.get(0).getProduct();
            int availableQuantity = calculateAvailableQuantityWithReservation(productRecipes, currentStocks, reservedFromOthers);
            List<IngredientLimit> ingredientLimits = getIngredientLimitsWithReservation(productRecipes, currentStocks, reservedFromOthers);
            
            results.put(productId, ProductStockResponse.builder()
                .productId(productId)
                .productName(product.getName())
                .availableQuantity(availableQuantity)
                .maxPossibleQuantity(availableQuantity)
                .isLimitedByInventory(true)
                .isOutOfStock(availableQuantity <= 0)
                .isLowStock(availableQuantity > 0 && availableQuantity <= 5)
                .ingredientLimits(ingredientLimits)
                .warningMessage(generateWarningMessage(ingredientLimits, availableQuantity))
                .build());
        }
        
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProductAvailable(Long productId, Integer requestedQuantity, List<CartItemRequest> cartItems) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            return false;
        }
        
        ProductStockResponse stock = calculateProductStock(productId, cartItems);
        // availableQuantity is how many MORE can be added
        return stock.getAvailableQuantity() >= requestedQuantity;
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getMaxAvailableQuantity(Long productId, List<CartItemRequest> cartItems) {
        ProductStockResponse stock = calculateProductStock(productId, cartItems);
        return stock.getAvailableQuantity();
    }

    // ============ Private Helper Methods ============

    /**
     * Get current inventory stock for required ingredients
     */
    private Map<Long, Double> getCurrentInventoryStock(List<Recipe> recipes) {
        Set<Long> inventoryIds = recipes.stream()
            .map(r -> r.getInventory().getId())
            .collect(Collectors.toSet());
        
        return getCurrentInventoryStocksByIds(inventoryIds);
    }
    
//    Get current inventory stocks by IDs
    private Map<Long, Double> getCurrentInventoryStocksByIds(Set<Long> inventoryIds) {
        if (inventoryIds.isEmpty()) {
            return new HashMap<>();
        }
        
        return inventoryRepository.findAllById(inventoryIds).stream()
            .collect(Collectors.toMap(Inventory::getId, Inventory::getQuantity));
    }

//     FIXED: Calculate reserved stock from OTHER products only (excluding current product)
    private Map<Long, Double> calculateReservedStockFromCartItemsExcludingProduct(
            List<CartItemRequest> cartItems, Long excludeProductId) {
        
        if (cartItems == null || cartItems.isEmpty()) {
            return new HashMap<>();
        }
        
        // Get all product IDs from cart EXCLUDING current product
        List<Long> productIds = cartItems.stream()
            .map(CartItemRequest::getProductId)
            .filter(Objects::nonNull)
            .filter(id -> !id.equals(excludeProductId))  // 🔥 Exclude current product
            .collect(Collectors.toList());
        
        if (productIds.isEmpty()) {
            return new HashMap<>();
        }
        
        // Get recipes for all other products in cart
        List<Recipe> allRecipes = recipeRepository.findByProductIdInWithInventory(productIds);
        Map<Long, List<Recipe>> recipesByProduct = allRecipes.stream()
            .collect(Collectors.groupingBy(r -> r.getProduct().getId()));
        
        Map<Long, Double> reservedIngredients = new HashMap<>();
        
        // Calculate total ingredient usage from OTHER cart items only
        for (CartItemRequest cartItem : cartItems) {
            Long productId = cartItem.getProductId();
            Integer quantity = cartItem.getQuantity();
            
            // 🔥 Skip the current product
            if (productId == null || quantity == null || quantity <= 0 || productId.equals(excludeProductId)) {
                continue;
            }
            
            List<Recipe> productRecipes = recipesByProduct.getOrDefault(productId, new ArrayList<>());
            
            for (Recipe recipe : productRecipes) {
                Long inventoryId = recipe.getInventory().getId();
                Double ingredientNeeded = recipe.getQuantity() * quantity;
                reservedIngredients.merge(inventoryId, ingredientNeeded, Double::sum);
            }
        }
        
        log.debug("Reserved ingredients from OTHER cart items (excluding product {}): {}", 
            excludeProductId, reservedIngredients);
        return reservedIngredients;
    }

//     Calculate available quantity based on the most limiting ingredient
    private int calculateAvailableQuantityWithReservation(List<Recipe> recipes,
                                                           Map<Long, Double> currentStocks,
                                                           Map<Long, Double> reservedStocks) {
        int maxQuantity = Integer.MAX_VALUE;
        
        for (Recipe recipe : recipes) {
            Long inventoryId = recipe.getInventory().getId();
            Double requiredPerUnit = recipe.getQuantity();
            Double currentStock = currentStocks.getOrDefault(inventoryId, 0.0);
            Double reserved = reservedStocks.getOrDefault(inventoryId, 0.0);
            
            // Available = Current - Reserved (from OTHER cart items only)
            Double availableStock = currentStock - reserved;
            
            if (availableStock <= 0) {
                log.debug("Ingredient {} has no available stock: current={}, reserved={}", 
                    inventoryId, currentStock, reserved);
                return 0;
            }
            
            int possibleUnits = (int) Math.floor(availableStock / requiredPerUnit);
            maxQuantity = Math.min(maxQuantity, possibleUnits);
            
            log.debug("Ingredient {}: required={}, current={}, reserved={}, available={}, possible units={}", 
                inventoryId, requiredPerUnit, currentStock, reserved, availableStock, possibleUnits);
        }
        
        return maxQuantity == Integer.MAX_VALUE ? 0 : maxQuantity;
    }

//      Get detailed ingredient limit breakdown with reservations
    private List<IngredientLimit> getIngredientLimitsWithReservation(List<Recipe> recipes,
                                                                      Map<Long, Double> currentStocks,
                                                                      Map<Long, Double> reservedStocks) {
        List<IngredientLimit> limits = new ArrayList<>();
        
        for (Recipe recipe : recipes) {
            Inventory inventory = recipe.getInventory();
            Double requiredPerUnit = recipe.getQuantity();
            Double currentStock = currentStocks.getOrDefault(inventory.getId(), 0.0);
            Double reserved = reservedStocks.getOrDefault(inventory.getId(), 0.0);
            Double availableStock = currentStock - reserved;
            
            int possibleUnits = availableStock <= 0 ? 0 : (int) Math.floor(availableStock / requiredPerUnit);
            
            limits.add(IngredientLimit.builder()
                .ingredientId(inventory.getId())
                .ingredientName(inventory.getName())
                .unit(inventory.getUnit() != null ? inventory.getUnit() : "unit")
                .requiredPerUnit(requiredPerUnit)
                .currentStock(currentStock)
                .reservedStock(reserved)
                .availableStock(Math.max(0, availableStock))
                .possibleUnits(possibleUnits)
                .isLimiting(false)
                .build());
        }
        
        // Find the minimum possible units to identify limiting ingredient
        int minUnits = limits.stream()
            .mapToInt(IngredientLimit::getPossibleUnits)
            .min()
            .orElse(Integer.MAX_VALUE);
        
        limits.forEach(limit -> {
            if (limit.getPossibleUnits() == minUnits && minUnits < Integer.MAX_VALUE) {
                limit.setIsLimiting(true);
            }
        });
        
        // Sort by most limiting first
        limits.sort(Comparator.comparingInt(IngredientLimit::getPossibleUnits));
        
        return limits;
    }
    
//      Build response for unlimited stock product (no ingredients needed)
    private ProductStockResponse buildUnlimitedStockResponse(Product product) {
        return ProductStockResponse.builder()
            .productId(product.getId())
            .productName(product.getName())
            .availableQuantity(UNLIMITED_QUANTITY)
            .maxPossibleQuantity(UNLIMITED_QUANTITY)
            .isLimitedByInventory(false)
            .isOutOfStock(false)
            .isLowStock(false)
            .ingredientLimits(new ArrayList<>())
            .build();
    }
    
//     Generate warning message based on stock status
    private String generateWarningMessage(List<IngredientLimit> ingredientLimits, int availableQuantity) {
        if (availableQuantity <= 0) {
            // Find the first limiting ingredient
            IngredientLimit limiting = ingredientLimits.stream()
                .filter(IngredientLimit::getIsLimiting)
                .findFirst()
                .orElse(null);
            
            if (limiting != null) {
                return String.format("Out of stock! Need %.2f %s of %s but only %.2f available",
                    limiting.getRequiredPerUnit(), 
                    limiting.getUnit(), 
                    limiting.getIngredientName(),
                    limiting.getAvailableStock());
            }
            return "Product is out of stock!";
        }
        
        if (availableQuantity <= 5) {
            IngredientLimit limiting = ingredientLimits.stream()
                .filter(IngredientLimit::getIsLimiting)
                .findFirst()
                .orElse(null);
            
            if (limiting != null) {
                return String.format("Low stock! Only %d more units can be added. Limited by %s (%s)",
                    availableQuantity, limiting.getIngredientName(), limiting.getUnit());
            }
            return String.format("Low stock! Only %d more units can be added.", availableQuantity);
        }
        
        return null;
    }
}