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
    
    // အခြေခံ ရှာဖွေမှုများ
    Optional<Order> findByInvoiceNo(String invoiceNo);
    List<Order> findByStatus(String status);
    
    // Dashboard အတွက် လိုအပ်သော Aggregate Queries
    // ၁။ သတ်မှတ်ထားသောနေ့ရက်အတွက် ရောင်းရငွေစုစုပေါင်း
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE FUNCTION('DATE', o.createdAt) = :date")
    Double sumTotalAmountByDate(@Param("date") LocalDate date);

    // ၂။ Status အလိုက် အရေအတွက်ရေတွက်ခြင်း
    long countByStatus(String status);

    // ၃။ ရောင်းအားလမ်းကြောင်း (ပြီးခဲ့သည့် ရက်အလိုက်)
    @Query(value = "SELECT DATE(created_at) as date, SUM(total_amount) as revenue FROM orders " +
                   "WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY) " +
                   "GROUP BY DATE(created_at) ORDER BY date ASC", nativeQuery = true)
    List<Map<String, Object>> findSalesTrend(@Param("days") int days);
    
    // ၄။ အရောင်းရဆုံး ပစ္စည်းများ (Top 5)
    @Query(value = "SELECT p.name, SUM(oi.quantity) as total_sold FROM order_items oi " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "GROUP BY p.name ORDER BY total_sold DESC LIMIT 5", nativeQuery = true)
    List<Map<String, Object>> findTopSellingProducts();
}