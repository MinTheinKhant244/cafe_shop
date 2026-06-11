package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // BASIC
    Optional<Order> findByInvoiceNo(String invoiceNo);

    List<Order> findByStatus(String status);

    long countByStatus(String status);

    
    // DASHBOARD - TODAY SALES
    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE DATE(o.createdAt) = :date
    """)
    Double sumTotalAmountByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE DATE(o.createdAt) = :date
    """)
    Long countByCreatedAtDate(@Param("date") LocalDate date);

    // SALES TREND (NATIVE SQL)
    @Query(value = """
        SELECT DATE(created_at) AS date,
               SUM(total_amount) AS revenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    """, nativeQuery = true)
    List<Map<String, Object>> findSalesTrend(@Param("days") int days);

    // TOP SELLING PRODUCTS
    @Query(value = """
        SELECT p.name AS name,
               SUM(oi.quantity) AS totalSold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.name
        ORDER BY totalSold DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Map<String, Object>> findTopSellingProducts();
    
}