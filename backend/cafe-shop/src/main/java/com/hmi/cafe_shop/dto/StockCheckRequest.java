package com.hmi.cafe_shop.dto;

import lombok.Data;
import java.util.List;

@Data
public class StockCheckRequest {
    private List<OrderItemDto> items;
    
    @Data
    public static class OrderItemDto {
        private ProductDto product;
        private Integer quantity;
    }//    
    @Data
    public static class ProductDto {
        private Long id;
        private String name;
    }
}