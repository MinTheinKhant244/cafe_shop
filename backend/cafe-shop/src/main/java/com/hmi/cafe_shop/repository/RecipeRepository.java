package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByProductId(Long productId);
}