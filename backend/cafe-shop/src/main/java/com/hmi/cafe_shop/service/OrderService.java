package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.dto.AddItemRequest;
import com.hmi.cafe_shop.dto.OrderRequestDTO;
import com.hmi.cafe_shop.dto.StockCheckRequest;
import com.hmi.cafe_shop.dto.StockCheckResponse;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.Payment;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface OrderService {

    Order createOrder(OrderRequestDTO order);
    
    // ⭐ Stock check method အသစ်
    StockCheckResponse checkStockAvailability(StockCheckRequest request);

    List<Order> getAllOrders();

    Optional<Order> getById(Long id);

    Optional<Order> getByInvoice(String invoiceNo);

    Order updateStatus(Long id, String status);
    void deductStockForOrder(Order order);

    Order updatePayment(Long id, String paymentMethod, String paymentStatus);
    
    
 // ========== 🆕 CASHIER API METHODS (4 New) ==========

//    1. Get cashier orders with filters
    List<Order> getCashierOrders(String status, String orderSource, 
                                 LocalDate startDate, LocalDate endDate, 
                                 String search);

//    2. Get order summary for cashier dashboard
//    OrderSummaryDTO getOrderSummary();

//    3. Update order status for cashier (with validation)
    Order updateCashierOrderStatus(Long id, String status);

//    4. Cancel order (restore stock, free table)
    Order cancelOrder(Long id);
    
    Order addItemToOrder(Long orderId, AddItemRequest request);
    
 // ===== 🆕 PAYMENT METHODS =====
    Payment processPayment(Long id, String paymentMethod, Double cashReceived);
    
//    List<Order> getPendingPaymentOrders(String orderSource);
    
//    Map<String, Object> getTodayRevenue();
}