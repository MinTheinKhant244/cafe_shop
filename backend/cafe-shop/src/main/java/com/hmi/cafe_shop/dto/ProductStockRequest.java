package com.hmi.cafe_shop.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProductStockRequest {
    private Long cartId;
    private List<CartItemRequest> cartItems;
}