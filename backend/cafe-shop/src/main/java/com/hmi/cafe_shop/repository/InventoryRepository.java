package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    
    @Query("SELECT i FROM Inventory i WHERE i.quantity <= i.lowStockThreshold")
    List<Inventory> findLowStockProducts();
    
    @Query("SELECT i FROM Inventory i WHERE i.quantity <= :threshold")
    List<Inventory> findProductsBelowQuantity(@Param("threshold") Double threshold);
    
    Optional<Inventory> findByName(String name);
    
    List<Inventory> findByQuantityLessThanEqual(Double quantity);
    
    @Query("SELECT i FROM Inventory i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Inventory> searchByName(@Param("keyword") String keyword);
    
    boolean existsByName(String name);
}