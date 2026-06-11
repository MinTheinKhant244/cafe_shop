package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Payment;
import com.hmi.cafe_shop.service.PaymentService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process/{orderId}")
    public ResponseEntity<Payment> process(
            @PathVariable Long orderId,
            @RequestBody Payment payment) {

        return ResponseEntity.ok(
                paymentService.processPayment(orderId, payment)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getById(@PathVariable Long id) {
        return paymentService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Payment> getByOrder(@PathVariable Long orderId) {
        return paymentService.getByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Payment>> getAll() {
        return ResponseEntity.ok(paymentService.getAll());
    }
}