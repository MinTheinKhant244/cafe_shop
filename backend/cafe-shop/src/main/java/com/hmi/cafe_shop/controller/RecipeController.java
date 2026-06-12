package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.RecipeCostDTO;
import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public ResponseEntity<List<Recipe>> getAll() {
        List<Recipe> recipes = recipeService.getAll();
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return recipeService.getById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch recipe: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Recipe recipe) {
        try {
            Recipe savedRecipe = recipeService.save(recipe);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRecipe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to create recipe: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Recipe recipe) {
        try {
            Recipe updatedRecipe = recipeService.update(id, recipe);
            return ResponseEntity.ok(updatedRecipe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update recipe: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            recipeService.delete(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Recipe deleted successfully");
            response.put("id", String.valueOf(id));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete recipe: " + e.getMessage()));
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getByProduct(@PathVariable Long productId) {
        try {
            List<Recipe> recipes = recipeService.getByProduct(productId);
            if (recipes.isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "No recipes found for this product");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(recipes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch recipes: " + e.getMessage()));
        }
    }

    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<?> getByInventory(@PathVariable Long inventoryId) {
        try {
            List<Recipe> recipes = recipeService.getByInventory(inventoryId);
            return ResponseEntity.ok(recipes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch recipes: " + e.getMessage()));
        }
    }

    @DeleteMapping("/product/{productId}")
    public ResponseEntity<?> deleteByProduct(@PathVariable Long productId) {
        try {
            recipeService.deleteByProductId(productId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "All recipes for product deleted successfully");
            response.put("productId", String.valueOf(productId));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete recipes: " + e.getMessage()));
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkIngredientExists(
            @RequestParam Long productId,
            @RequestParam Long inventoryId) {
        try {
            boolean exists = recipeService.checkIfIngredientExists(productId, inventoryId);
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to check ingredient: " + e.getMessage()));
        }
    }

    // Get recipe cost for a product
    @GetMapping("/product/{productId}/cost")
    public ResponseEntity<?> getRecipeCost(@PathVariable Long productId) {
        try {
            Double totalCost = recipeService.calculateRecipeCost(productId);
            Map<String, Object> response = new HashMap<>();
            response.put("productId", productId);
            response.put("totalCost", totalCost);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to calculate recipe cost: " + e.getMessage()));
        }
    }

    // Get detailed recipe cost breakdown
    @GetMapping("/product/{productId}/cost-details")
    public ResponseEntity<?> getRecipeCostDetails(@PathVariable Long productId) {
        try {
            RecipeCostDTO costDetails = recipeService.getRecipeCostDetails(productId);
            return ResponseEntity.ok(costDetails);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get recipe cost details: " + e.getMessage()));
        }
    }

    // Get total inventory cost for a product
    @GetMapping("/product/{productId}/inventory-cost")
    public ResponseEntity<?> getTotalInventoryCost(@PathVariable Long productId) {
        try {
            Double totalCost = recipeService.getTotalInventoryCostForProduct(productId);
            Map<String, Object> response = new HashMap<>();
            response.put("productId", productId);
            response.put("totalInventoryCost", totalCost);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get inventory cost: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return error;
    }
}