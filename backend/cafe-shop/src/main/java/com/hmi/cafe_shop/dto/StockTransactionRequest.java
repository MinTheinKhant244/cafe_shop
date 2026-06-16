package com.hmi.cafe_shop.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Data
public class StockTransactionRequest {

    @NotNull(message = "Inventory ID is required")
    private Long inventoryId;

    @NotBlank(message = "Transaction type is required")
    private String transactionType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Double quantity;

    private Double unitPrice;

    private String referenceNo;

    private String remark;
}