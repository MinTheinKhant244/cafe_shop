package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.RecipeCostDTO;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.repository.RecipeRepository;
import com.hmi.cafe_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RecipeServiceImpl implements RecipeService {

    private final RecipeRepository recipeRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public List<Recipe> getAll() {
        return recipeRepository.findAll();
    }

    @Override
    public Optional<Recipe> getById(Long id) {
        return recipeRepository.findById(id);
    }

    @Override
    public Recipe save(Recipe recipe) {
        // Validate input
        if (recipe.getProduct() == null || recipe.getProduct().getId() == null) {
            throw new IllegalArgumentException("Product is required");
        }
        if (recipe.getInventory() == null || recipe.getInventory().getId() == null) {
            throw new IllegalArgumentException("Inventory ingredient is required");
        }
        if (recipe.getQuantity() == null || recipe.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        
        // Check if product exists
        Product product = productRepository.findById(recipe.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + recipe.getProduct().getId()));
        
        // Check if inventory exists
        Inventory inventory = inventoryRepository.findById(recipe.getInventory().getId())
                .orElseThrow(() -> new RuntimeException("Inventory item not found with id: " + recipe.getInventory().getId()));
        
        // Check for duplicate recipe entry
        if (recipeRepository.existsByProductIdAndInventoryId(product.getId(), inventory.getId())) {
            throw new IllegalArgumentException("This ingredient is already added to the product");
        }
        
        recipe.setProduct(product);
        recipe.setInventory(inventory);
        
        return recipeRepository.save(recipe);
    }

    @Override
    public Recipe update(Long id, Recipe recipe) {
        Recipe existing = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
        
        // Update fields if provided
        if (recipe.getQuantity() != null && recipe.getQuantity() > 0) {
            existing.setQuantity(recipe.getQuantity());
        }
        
        if (recipe.getInventory() != null && recipe.getInventory().getId() != null) {
            Inventory inventory = inventoryRepository.findById(recipe.getInventory().getId())
                    .orElseThrow(() -> new RuntimeException("Inventory item not found"));
            
            // Check if changing inventory would cause duplicate
            if (!existing.getInventory().getId().equals(inventory.getId()) &&
                recipeRepository.existsByProductIdAndInventoryId(existing.getProduct().getId(), inventory.getId())) {
                throw new IllegalArgumentException("This ingredient is already added to the product");
            }
            existing.setInventory(inventory);
        }
        
        return recipeRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        if (!recipeRepository.existsById(id)) {
            throw new RuntimeException("Recipe not found with id: " + id);
        }
        recipeRepository.deleteById(id);
    }

    @Override
    public List<Recipe> getByProduct(Long productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        return recipeRepository.findByProductIdWithDetails(productId);
    }

    @Override
    public List<Recipe> getByInventory(Long inventoryId) {
        if (inventoryId == null) {
            throw new IllegalArgumentException("Inventory ID is required");
        }
        return recipeRepository.findByInventoryId(inventoryId);
    }

    @Override
    @Transactional
    public void deleteByProductId(Long productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        recipeRepository.deleteByProductId(productId);
    }

    @Override
    public boolean checkIfIngredientExists(Long productId, Long inventoryId) {
        return recipeRepository.existsByProductIdAndInventoryId(productId, inventoryId);
    }

    // Calculate total recipe cost for a product
    @Override
    public Double calculateRecipeCost(Long productId) {
        List<Recipe> recipes = getByProduct(productId);
        
        double totalCost = 0.0;
        for (Recipe recipe : recipes) {
            Inventory inventory = recipe.getInventory();
            Double unitPrice = inventory.getCurrentPrice() != null ? inventory.getCurrentPrice() : 0.0;
            totalCost += unitPrice * recipe.getQuantity();
        }
        
        return totalCost;
    }

    // Get detailed recipe cost information
    @Override
    public RecipeCostDTO getRecipeCostDetails(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        List<Recipe> recipes = getByProduct(productId);
        
        List<RecipeCostDTO.IngredientCostDTO> ingredients = new ArrayList<>();
        double totalCost = 0.0;
        Map<String, Double> costBreakdown = new HashMap<>();
        
        for (Recipe recipe : recipes) {
            Inventory inventory = recipe.getInventory();
            Double unitPrice = inventory.getCurrentPrice() != null ? inventory.getCurrentPrice() : 0.0;
            Double ingredientCost = unitPrice * recipe.getQuantity();
            totalCost += ingredientCost;
            
            // Add to ingredients list
            ingredients.add(RecipeCostDTO.IngredientCostDTO.builder()
                .ingredientId(inventory.getId())
                .ingredientName(inventory.getName())
                .unit(inventory.getUnit())
                .quantity(recipe.getQuantity())
                .unitPrice(unitPrice)
                .totalCost(ingredientCost)
                .build());
            
            // Add to cost breakdown
            costBreakdown.put(inventory.getName(), ingredientCost);
        }
        
        Double sellingPrice = product.getPrice() != null ? product.getPrice() : 0.0;
        Double profit = sellingPrice - totalCost;
        Double profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        
        return RecipeCostDTO.builder()
            .productId(product.getId())
            .productName(product.getName())
            .sellingPrice(sellingPrice)
            .totalCost(totalCost)
            .profit(profit)
            .profitMargin(profitMargin)
            .ingredients(ingredients)
            .costBreakdown(costBreakdown)
            .build();
    }

    // Get total inventory cost for a product (what inventory is used)
    @Override
    public Double getTotalInventoryCostForProduct(Long productId) {
        return calculateRecipeCost(productId);
    }
}