package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.OrderRequestDTO;
import com.hmi.cafe_shop.dto.OrderSummaryDTO;
import com.hmi.cafe_shop.dto.StockCheckRequest;
import com.hmi.cafe_shop.dto.StockCheckResponse;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.exception.OrderNotFoundException;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.service.OrderService;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    // 1. CREATE ORDER
    @PostMapping("/create")
    public ResponseEntity<Order> create(@RequestBody OrderRequestDTO request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    // 2. CHECK STOCK
    @PostMapping("/check-stock")
    public ResponseEntity<StockCheckResponse> checkStock(@RequestBody StockCheckRequest request) {
        return ResponseEntity.ok(orderService.checkStockAvailability(request));
    }

    // 3. GET ALL ORDERS
    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAll() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // 4. GET ORDER BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return orderService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. GET ORDER BY INVOICE
    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<Order> getByInvoice(@PathVariable String invoiceNo) {
        return orderService.getByInvoice(invoiceNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. UPDATE ORDER STATUS
    @PatchMapping("/status/{id}")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    // 7. DEDUCT STOCK FOR ORDER
    @PostMapping("/order/{orderId}/deduct")
    public ResponseEntity<String> deductStockForOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        orderService.deductStockForOrder(order);
        return ResponseEntity.ok("Stock deducted successfully");
    }

    // 8. UPDATE PAYMENT STATUS
    @PatchMapping("/payment/{id}")
    public ResponseEntity<Order> updatePayment(
            @PathVariable Long id,
            @RequestParam String paymentStatus) {
        return ResponseEntity.ok(orderService.updatePayment(id, paymentStatus));
    }

    // ========== CASHIER APIS (4 New Endpoints) ==========

//    9. CASHIER - Get orders with filters
    @GetMapping("/cashier/orders")
    public ResponseEntity<List<Order>> getCashierOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String orderSource,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search) {

        
        List<Order> orders = orderService.getCashierOrders(status, orderSource, startDate, endDate, search);
                
        return ResponseEntity.ok(orders);
    }

//    10. CASHIER - Get order summary for dashboard
    @GetMapping("/cashier/summary")
    public ResponseEntity<OrderSummaryDTO> getOrderSummary() {
        return ResponseEntity.ok(orderService.getOrderSummary());
    }

//    11. CASHIER - Update order status (with validation)
    @PatchMapping("/cashier/status/{id}")
    public ResponseEntity<Order> updateCashierOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateCashierOrderStatus(id, status));
    }

//    12. CASHIER - Cancel order (restore stock, free table)
    @PatchMapping("/cashier/cancel/{id}")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
    
 // ========== 🆕 PAYMENT APIS ==========

//     13. CASHIER - Update payment status (Cashier specific)
    @PatchMapping("/cashier/payment/{id}")
    public ResponseEntity<Order> updateCashierPayment(
            @PathVariable Long id,
            @RequestParam String paymentStatus) {
        return ResponseEntity.ok(orderService.updatePayment(id, paymentStatus));
    }

    @PostMapping("/cashier/payment/process/{id}")
    public ResponseEntity<?> processPayment(
            @PathVariable Long id,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) Double cashReceived) {
        
        Order order = orderService.getById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found"));
        
        if ("COMPLETED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Order is already completed"));
        }
        
        if ("PAID".equals(order.getPaymentStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Order is already paid"));
        }
        
        if ("CANCELLED".equals(order.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot process payment for cancelled order"));
        }
        
        return ResponseEntity.ok(orderService.processPayment(id, paymentMethod, cashReceived));
    }

//    15. CASHIER - Get pending payment orders
    @GetMapping("/cashier/pending-payments")
    public ResponseEntity<List<Order>> getPendingPaymentOrders(
            @RequestParam(required = false) String orderSource) {
        return ResponseEntity.ok(orderService.getPendingPaymentOrders(orderSource));
    }

//    16. CASHIER - Get today's revenue summary
    @GetMapping("/cashier/today-revenue")
    public ResponseEntity<Map<String, Object>> getTodayRevenue() {
        return ResponseEntity.ok(orderService.getTodayRevenue());
    }
}