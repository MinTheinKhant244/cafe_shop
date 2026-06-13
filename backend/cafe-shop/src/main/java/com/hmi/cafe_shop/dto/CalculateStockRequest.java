package com.hmi.cafe_shop.dto;

import java.util.List;

import lombok.Data;

@Data
public class CalculateStockRequest {
    private List<CartItemRequest> cartItems;
}