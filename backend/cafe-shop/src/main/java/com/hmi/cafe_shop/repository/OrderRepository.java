package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.OrderItem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    
    
 // ========== 🆕 CASHIER METHODS (4 New) ==========

// // OrderRepository.java
 // OrderRepository.java

    @Query(value = """
        SELECT * FROM orders o
        WHERE (:status IS NULL OR o.status = :status)
        AND (:orderSource IS NULL OR o.order_source = :orderSource)
        AND (:startDate IS NULL OR o.created_at >= :startDate)
        AND (:endDate IS NULL OR o.created_at <= :endDate)
        AND (:search IS NULL OR 
             LOWER(o.invoice_no) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY o.created_at DESC
    """, nativeQuery = true)
    List<Order> findCashierOrders(
        @Param("status") String status,
        @Param("orderSource") String orderSource,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("search") String search
    );
    
    
    

//     2. Get today's order summary for dashboard
//    @Query("""
//        SELECT 
//            COUNT(CASE WHEN o.status = 'PREPARING' THEN 1 END) AS newOrders,
//            COUNT(CASE WHEN o.status = 'IN_PROGRESS' THEN 1 END) AS inProgressOrders,
//            COUNT(CASE WHEN o.status = 'READY' THEN 1 END) AS readyOrders,
//            COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS completedOrders,
//            COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) AS cancelledOrders,
//            COUNT(CASE WHEN o.paymentStatus = 'PENDING' AND o.status != 'CANCELLED' THEN 1 END) AS pendingPaymentOrders,
//            COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.totalAmount ELSE 0 END), 0) AS todayRevenue,
//            COUNT(o) AS totalOrdersToday
//        FROM Order o
//        WHERE DATE(o.createdAt) = :date
//    """)
//    Map<String, Object> findTodayOrderSummary(@Param("date") LocalDate date);
    
    

//    Get pending payment orders
//  findByCreatedAtBetween - JPA will auto-implement this
//    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
//    
//    @Query("""
//        SELECT o FROM Order o
//        WHERE o.paymentStatus = 'PENDING'
//        AND o.status != 'CANCELLED'
//        AND (:orderSource IS NULL OR o.orderSource = :orderSource)
//        ORDER BY o.createdAt ASC
//    """)
//    List<Order> findPendingPaymentOrders(@Param("orderSource") String orderSource);

//     Count pending payment orders
//    @Query("""
//        SELECT COUNT(o) FROM Order o
//        WHERE o.paymentStatus = 'PENDING'
//        AND o.status != 'CANCELLED'
//        AND (:orderSource IS NULL OR o.orderSource = :orderSource)
//    """)
//    long countPendingPaymentOrders(@Param("orderSource") String orderSource);
}