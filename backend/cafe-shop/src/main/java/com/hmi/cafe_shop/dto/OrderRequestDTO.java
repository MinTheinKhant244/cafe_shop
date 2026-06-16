package com.hmi.cafe_shop.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Long createdBy;        
    private Long tableId;          
    private Double totalAmount;
    private String paymentStatus;
    private String orderSource;
    private String status;
    private String orderNote;
    private String combinedTables;
    private String paymentMethod;
    private List<OrderItemDTO> orderItems;
    
    @Data
    public static class OrderItemDTO {
        private Long inventoryId;
        private Long productId;     
        private Integer quantity;
        private Double price;
    }
}