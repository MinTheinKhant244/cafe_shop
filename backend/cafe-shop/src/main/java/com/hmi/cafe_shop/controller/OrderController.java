package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.StockCheckRequest;
import com.hmi.cafe_shop.dto.StockCheckResponse;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.service.OrderService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

	private final OrderRepository orderRepository;
    private final OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Order> create(@RequestBody Order order) {
        return ResponseEntity.ok(orderService.createOrder(order));
    }
    
    // ⭐ Stock Check API
    @PostMapping("/check-stock")
    public ResponseEntity<StockCheckResponse> checkStock(@RequestBody StockCheckRequest request) {
        return ResponseEntity.ok(orderService.checkStockAvailability(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAll() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return orderService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<Order> getByInvoice(@PathVariable String invoiceNo) {
        return orderService.getByInvoice(invoiceNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/status/{id}")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }
    
 // 2. Deduct Stock API (For Order Checkout)
    @PostMapping("/order/{orderId}/deduct")
    public ResponseEntity<String> deductStockForOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        orderService.deductStockForOrder(order);
        return ResponseEntity.ok("Stock deducted successfully");
    }

    @PatchMapping("/payment/{id}")
    public ResponseEntity<Order> updatePayment(
            @PathVariable Long id,
            @RequestParam String paymentStatus) {
        return ResponseEntity.ok(orderService.updatePayment(id, paymentStatus));
    }
}