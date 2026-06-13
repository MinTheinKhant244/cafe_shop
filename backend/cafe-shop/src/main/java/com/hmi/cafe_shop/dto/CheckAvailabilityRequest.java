package com.hmi.cafe_shop.dto;

import java.util.List;

import lombok.Data;


@Data
public class CheckAvailabilityRequest {
    private Integer quantity;
    private List<CartItemRequest> cartItems;
}