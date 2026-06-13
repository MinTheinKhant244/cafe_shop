package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.dto.CartItemRequest;
import com.hmi.cafe_shop.dto.ProductStockResponse;

import java.util.List;
import java.util.Map;

public interface ProductStockService {

//    Calculate available stock for a single product considering cart items
    ProductStockResponse calculateProductStock(Long productId, List<CartItemRequest> cartItems);

//    Calculate available stock for multiple products considering cart items
    Map<Long, ProductStockResponse> calculateBatchStock(List<Long> productIds, List<CartItemRequest> cartItems);

//    Check if requested quantity is available
    boolean isProductAvailable(Long productId, Integer requestedQuantity, List<CartItemRequest> cartItems);

//    Get maximum available quantity for a product
    Integer getMaxAvailableQuantity(Long productId, List<CartItemRequest> cartItems);
    
}
