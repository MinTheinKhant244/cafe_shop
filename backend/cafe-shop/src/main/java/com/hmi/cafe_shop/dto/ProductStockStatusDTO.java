package com.hmi.cafe_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ProductStockStatusDTO {
    private Long productId;
    private String name;
    private Double availableQuantity; 
    private boolean isOutOfStock;
}