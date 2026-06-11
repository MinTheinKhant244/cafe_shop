package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Order;
import java.util.List;
import java.util.Optional;

public interface OrderService {

    Order createOrder(Order order);

    List<Order> getAllOrders();

    Optional<Order> getById(Long id);

    Optional<Order> getByInvoice(String invoiceNo);

    Order updateStatus(Long id, String status);

    Order updatePayment(Long id, String paymentStatus);
}