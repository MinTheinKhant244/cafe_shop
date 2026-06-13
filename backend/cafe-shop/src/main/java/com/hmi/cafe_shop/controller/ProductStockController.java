package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.BatchStockRequest;
import com.hmi.cafe_shop.dto.CalculateStockRequest;
import com.hmi.cafe_shop.dto.CartItemRequest;
import com.hmi.cafe_shop.dto.CheckAvailabilityRequest;
import com.hmi.cafe_shop.dto.ProductStockResponse;
import com.hmi.cafe_shop.service.ProductStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/product-stock")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductStockController {

    private final ProductStockService productStockService;

    /**
     * Calculate available stock for a single product with cart items
     * POST /api/product-stock/{productId}/calculate
     */
    @PostMapping("/{productId}/calculate")
    public ResponseEntity<ProductStockResponse> calculateProductStock(
            @PathVariable Long productId,
            @RequestBody(required = false) CalculateStockRequest request) {
        
        log.debug("POST /product-stock/{}/calculate with request: {}", productId, request);
        
        List<CartItemRequest> cartItems = request != null ? request.getCartItems() : null;
        ProductStockResponse response = productStockService.calculateProductStock(productId, cartItems);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Calculate available stock for multiple products with cart items
     * POST /api/product-stock/batch/calculate
     */
    @PostMapping("/batch/calculate")
    public ResponseEntity<Map<Long, ProductStockResponse>> calculateBatchStock(
            @RequestBody BatchStockRequest request) {
        
        log.debug("POST /product-stock/batch/calculate with {} products", 
            request.getProductIds() != null ? request.getProductIds().size() : 0);
        
        List<Long> productIds = request.getProductIds();
        List<CartItemRequest> cartItems = request.getCartItems();
        
        Map<Long, ProductStockResponse> responses = productStockService.calculateBatchStock(productIds, cartItems);
        
        return ResponseEntity.ok(responses);
    }

    /**
     * Check if requested quantity is available
     * POST /api/product-stock/{productId}/check
     */
    @PostMapping("/{productId}/check")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @PathVariable Long productId,
            @RequestBody CheckAvailabilityRequest request) {
        
        boolean available = productStockService.isProductAvailable(
            productId, 
            request.getQuantity(), 
            request.getCartItems()
        );
        
        return ResponseEntity.ok(Map.of("available", available));
    }

    /**
     * Get max available quantity
     * POST /api/product-stock/{productId}/max-quantity
     */
    @PostMapping("/{productId}/max-quantity")
    public ResponseEntity<Map<String, Integer>> getMaxAvailableQuantity(
            @PathVariable Long productId,
            @RequestBody(required = false) CalculateStockRequest request) {
        
        List<CartItemRequest> cartItems = request != null ? request.getCartItems() : null;
        Integer maxQuantity = productStockService.getMaxAvailableQuantity(productId, cartItems);
        
        return ResponseEntity.ok(Map.of("maxQuantity", maxQuantity));
    }
}
