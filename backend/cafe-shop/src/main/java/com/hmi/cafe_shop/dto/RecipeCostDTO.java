package com.hmi.cafe_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeCostDTO {
    private Long productId;
    private String productName;
    private Double sellingPrice;
    private Double totalCost;
    private Double profit;
    private Double profitMargin;
    private List<IngredientCostDTO> ingredients;
    private Map<String, Double> costBreakdown;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IngredientCostDTO {
        private Long ingredientId;
        private String ingredientName;
        private String unit;
        private Double quantity;
        private Double unitPrice;
        private Double totalCost;
    }
}