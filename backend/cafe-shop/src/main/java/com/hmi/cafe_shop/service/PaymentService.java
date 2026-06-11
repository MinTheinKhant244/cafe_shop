package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Payment;
import java.util.List;
import java.util.Optional;

public interface PaymentService {

    Payment processPayment(Long orderId, Payment payment);

    Optional<Payment> getById(Long id);

    Optional<Payment> getByOrderId(Long orderId);

    List<Payment> getAll();
}