package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Order;
import java.util.List;
import java.util.Optional;

public interface OrderService {
    Order createOrder(Order order);
    Optional<Order> getOrderById(Long id);
    Optional<Order> getOrderByInvoiceNo(String invoiceNo);
    List<Order> getAllOrders();
    List<Order> getOrdersByStatus(String status);
    Order updateOrderStatus(Long id, String status);
    Order updatePaymentStatus(Long id, String paymentStatus);
}