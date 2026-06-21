// src/main/java/com/hmi/cafe_shop/repository/OrderItemRepository.java
package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Find order item by order and product
     * Used for checking if product already exists in order
     */
    Optional<OrderItem> findByOrderIdAndProductId(Long orderId, Long productId);
    
    /**
     * Find all order items by order ID
     * Used for calculating total amount
     */
    List<OrderItem> findByOrderId(Long orderId);
}