package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.repository.RecipeRepository;
import com.hmi.cafe_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
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
        return recipeRepository.save(recipe);
    }

    @Override
    public Recipe update(Long id, Recipe recipe) {

        Recipe existing = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        existing.setProduct(recipe.getProduct());
        existing.setInventory(recipe.getInventory());
        existing.setQuantity(recipe.getQuantity());

        return recipeRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        recipeRepository.deleteById(id);
    }

    @Override
    public List<Recipe> getByProduct(Long productId) {
        return recipeRepository.findByProductId(productId);
    }
}