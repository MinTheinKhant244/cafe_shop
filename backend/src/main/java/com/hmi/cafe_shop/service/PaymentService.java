package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Payment;
import java.util.List;
import java.util.Optional;

public interface PaymentService {
    Payment processPayment(Payment payment);
    Optional<Payment> getPaymentById(Long id);
    Optional<Payment> getPaymentByOrderId(Long orderId);
    List<Payment> getAllPayments();
}