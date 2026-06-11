package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public ResponseEntity<List<Recipe>> getAll() {
        return ResponseEntity.ok(recipeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getById(@PathVariable Long id) {
        return recipeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Recipe> create(@RequestBody Recipe recipe) {
        return ResponseEntity.ok(recipeService.save(recipe));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Recipe> update(
            @PathVariable Long id,
            @RequestBody Recipe recipe) {

        return ResponseEntity.ok(recipeService.update(id, recipe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        recipeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Recipe>> getByProduct(
            @PathVariable Long productId) {

        return ResponseEntity.ok(recipeService.getByProduct(productId));
    }
}
