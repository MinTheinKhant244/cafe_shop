//package com.hmi.cafe_shop.serviceImpl;
//
//import com.hmi.cafe_shop.entity.*;
//import com.hmi.cafe_shop.repository.*;
//import com.hmi.cafe_shop.service.PaymentService;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//
//@Service
//@RequiredArgsConstructor
//public class PaymentServiceImpl implements PaymentService {
//
//    private final PaymentRepository paymentRepository;
//    private final OrderRepository orderRepository;
//
//    @Override
//    @Transactional
//    public Payment processPayment(Long orderId, Payment payment) {
//
//        // 1. GET ORDER
//        Order order = orderRepository.findById(orderId)
//                .orElseThrow(() -> new RuntimeException("Order not found"));
//
//        // 2. CHECK already paid
//        if ("PAID".equals(order.getPaymentStatus())) {
//            throw new RuntimeException("Order already paid");
//        }
//
//        // 3. VALIDATE amount
//        if (payment.getAmount() == null || payment.getAmount() <= 0) {
//            throw new RuntimeException("Invalid amount");
//        }
//
//        // 4. CASH LOGIC
//        if ("CASH".equalsIgnoreCase(payment.getMethod())) {
//
//            if (payment.getCashReceived() == null) {
//                throw new RuntimeException("Cash received required");
//            }
//
//            double change = payment.getCashReceived() - payment.getAmount();
//            payment.setChangeAmount(change > 0 ? change : 0.0);
//        }
//
//        // 5. UPDATE ORDER
//        order.setPaymentStatus("PAID");
//        order.setStatus("COMPLETED");
//        order.setPaymentMethod(payment.getMethod());
//
//        orderRepository.save(order);
//
//        // 6. LINK ORDER
//        payment.setOrder(order);
//
//        // 7. TRANSACTION NO
//        payment.setTransactionNo(UUID.randomUUID().toString());
//
//        payment.setStatus("SUCCESS");
//
//        return paymentRepository.save(payment);
//    }
//   
//    @Override
//    public Optional<Payment> getById(Long id) {
//        return paymentRepository.findById(id);
//    }
//
//    @Override
//    public Optional<Payment> getByOrderId(Long orderId) {
//        return paymentRepository.findByOrderId(orderId);
//    }
//
//    @Override
//    public List<Payment> getAll() {
//        return paymentRepository.findAll();
//    }
//}