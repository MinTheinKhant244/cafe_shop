package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface DashboardRepository extends JpaRepository<Order, Long> {

    // ============================================================
    // ORDER STATS
    // ============================================================

    // Get orders by date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    List<Order> findOrdersByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Count orders by status
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdAt BETWEEN :start AND :end")
    Long countOrdersByStatusAndDateRange(
            @Param("status") String status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Count orders by payment status
    @Query("SELECT COUNT(o) FROM Order o WHERE o.paymentStatus = :paymentStatus AND o.status != 'CANCELLED' AND o.createdAt BETWEEN :start AND :end")
    Long countOrdersByPaymentStatusAndDateRange(
            @Param("paymentStatus") String paymentStatus,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Total revenue by date range
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE (o.paymentStatus = 'PAID' OR o.status = 'COMPLETED') " +
           "AND o.createdAt BETWEEN :start AND :end")
    Double getTotalRevenueByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Count unique customers by date range
    @Query("SELECT COUNT(DISTINCT o.createdBy.id) FROM Order o WHERE o.createdAt BETWEEN :start AND :end")
    Long countUniqueCustomersByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // ============================================================
    // RECENT ORDERS
    // ============================================================

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(@Param("limit") int limit);

    // ============================================================
    // SALES TREND
    // ============================================================

    @Query(value = """
        SELECT 
            DATE(o.created_at) as date,
            COALESCE(SUM(o.total_amount), 0) as revenue,
            COUNT(o.id) as orders,
            COALESCE(AVG(o.total_amount), 0) as avg_order_value
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        AND (o.payment_status = 'PAID' OR o.status = 'COMPLETED')
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
    """, nativeQuery = true)
    List<Object[]> findSalesTrend(@Param("days") int days);

    // ============================================================
    // TOP PRODUCTS
    // ============================================================

    @Query(value = """
        SELECT 
            p.id as product_id,
            p.name as product_name,
            c.name as category,
            COALESCE(SUM(oi.quantity), 0) as total_quantity,
            COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE (o.payment_status = 'PAID' OR o.status = 'COMPLETED')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        GROUP BY p.id, p.name, c.name
        ORDER BY total_quantity DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findTopProducts(
            @Param("limit") int limit,
            @Param("days") int days
    );

    // ============================================================
    // ORDER SOURCE STATS
    // ============================================================

    @Query("""
        SELECT o.orderSource, COUNT(o), COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.createdAt BETWEEN :start AND :end
        AND (o.paymentStatus = 'PAID' OR o.status = 'COMPLETED')
        GROUP BY o.orderSource
    """)
    List<Object[]> getOrderSourceStats(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // ============================================================
    // LOW STOCK INVENTORY
    // ============================================================

    @Query("SELECT i FROM Inventory i WHERE i.quantity < i.lowStockThreshold AND i.status = 'ACTIVE'")
    List<Inventory> findLowStockItems();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.quantity < i.lowStockThreshold AND i.status = 'ACTIVE'")
    Long countLowStockItems();

    // ============================================================
    // DASHBOARD SUMMARY (Single Query)
    // ============================================================

    @Query("""
        SELECT 
            COUNT(o) as totalOrders,
            COALESCE(SUM(CASE WHEN o.paymentStatus = 'PAID' OR o.status = 'COMPLETED' THEN o.totalAmount ELSE 0 END), 0) as totalRevenue,
            COUNT(CASE WHEN o.status = 'PENDING' THEN 1 END) as pendingOrders,
            COUNT(CASE WHEN o.status = 'PREPARING' THEN 1 END) as preparingOrders,
            COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completedOrders,
            COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) as cancelledOrders,
            COUNT(CASE WHEN o.paymentStatus = 'PENDING' AND o.status != 'CANCELLED' THEN 1 END) as pendingPaymentOrders,
            COUNT(DISTINCT o.createdBy.id) as uniqueCustomers
        FROM Order o
        WHERE o.createdAt BETWEEN :start AND :end
    """)
    List<Object[]> getDashboardStatsByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}