package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByProductId(Long productId);
    
    List<Recipe> findByInventoryId(Long inventoryId);
    
    Optional<Recipe> findByProductIdAndInventoryId(Long productId, Long inventoryId);
    
    boolean existsByProductIdAndInventoryId(Long productId, Long inventoryId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Recipe r WHERE r.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
    
    @Query("SELECT r FROM Recipe r JOIN FETCH r.product JOIN FETCH r.inventory WHERE r.product.id = :productId")
    List<Recipe> findByProductIdWithDetails(@Param("productId") Long productId);
}