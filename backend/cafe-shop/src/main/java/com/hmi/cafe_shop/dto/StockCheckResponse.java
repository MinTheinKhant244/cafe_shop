package com.hmi.cafe_shop.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockCheckResponse {
    private boolean available;
    private List<StockIssue> issues;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StockIssue {
        private String productName;
        private String ingredientName;
        private Double available;
        private Double required;
    }
}