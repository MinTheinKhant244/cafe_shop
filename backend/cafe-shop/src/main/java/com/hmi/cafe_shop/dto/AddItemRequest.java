package com.hmi.cafe_shop.dto;

import lombok.Data;

@Data
public class AddItemRequest {
    private Long productId;
    private Integer quantity;
}