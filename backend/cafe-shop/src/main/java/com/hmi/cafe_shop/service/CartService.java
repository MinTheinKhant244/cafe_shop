package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Cart;

public interface CartService {
    Cart getCart(Long userId);
    void addToCart(Long userId, Long productId, Integer quantity);
    void clearCart(Long userId);
}
