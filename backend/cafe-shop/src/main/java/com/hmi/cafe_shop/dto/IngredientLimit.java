package com.hmi.cafe_shop.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IngredientLimit {
    private Long ingredientId;
    private String ingredientName;
    private String unit;
    private Double requiredPerUnit;
    private Double currentStock;
    private Double reservedStock;
    private Double availableStock;
    private Integer possibleUnits;
    private Boolean isLimiting;
    private Boolean isInactive;  
}