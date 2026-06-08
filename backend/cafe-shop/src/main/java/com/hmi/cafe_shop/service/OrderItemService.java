package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.OrderItem;
import java.util.List;

public interface OrderItemService {
    OrderItem addOrderItem(OrderItem orderItem);
    List<OrderItem> getItemsByOrderId(Long orderId);
    void deleteOrderItem(Long id);
}