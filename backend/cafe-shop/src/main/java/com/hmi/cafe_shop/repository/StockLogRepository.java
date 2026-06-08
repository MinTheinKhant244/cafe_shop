package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    List<StockLog> findByProductIdOrderByLoggedAtDesc(Long productId);
    List<StockLog> findByReferenceType(String referenceType);
    List<StockLog> findByExpireDateBeforeAndQuantityGreaterThan(LocalDate date, Integer quantity);
    
//    @Query("SELECT s FROM StockLog s WHERE s.expireDate >= :currentDate AND s.expireDate <= :targetDate AND s.quantity > 0")
//    List<StockLog> findExpiringStocks(@Param("currentDate") LocalDate currentDate, @Param("targetDate") LocalDate targetDate);
    
}