package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Recipe;

import java.util.List;
import java.util.Optional;

public interface RecipeService {

    List<Recipe> getAll();

    Optional<Recipe> getById(Long id);

    Recipe save(Recipe recipe);

    Recipe update(Long id, Recipe recipe);

    void delete(Long id);

    List<Recipe> getByProduct(Long productId);
}