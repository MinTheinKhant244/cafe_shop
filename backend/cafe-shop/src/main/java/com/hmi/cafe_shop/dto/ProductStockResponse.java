package com.hmi.cafe_shop.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ProductStockResponse {
    private Long productId;
    private String productName;
    private Integer availableQuantity;
    private Integer maxPossibleQuantity;
    private Boolean isLimitedByInventory;
    private Boolean isOutOfStock;
    private Boolean isLowStock;
    private List<IngredientLimit> ingredientLimits;
    private String warningMessage;
    
    public boolean isOutOfStock() {
        return isOutOfStock != null && isOutOfStock;
    }
    
    public boolean isLowStock() {
        return isLowStock != null && isLowStock;
    }
}