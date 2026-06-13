package com.hmi.cafe_shop.dto;

import java.util.List;
import lombok.Data;

@Data
public class BatchStockRequest {
 private List<Long> productIds;
 private List<CartItemRequest> cartItems;
}