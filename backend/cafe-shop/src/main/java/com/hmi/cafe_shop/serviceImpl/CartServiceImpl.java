package com.hmi.cafe_shop.serviceImpl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hmi.cafe_shop.entity.Cart;
import com.hmi.cafe_shop.entity.CartItem;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.entity.Recipe;
import com.hmi.cafe_shop.repository.CartItemRepository;
import com.hmi.cafe_shop.repository.CartRepository;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.repository.RecipeRepository;
import com.hmi.cafe_shop.service.CartService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public Cart getCart(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    // Set user logic here
                    return cartRepository.save(newCart);
                });
    }

    @Override
    @Transactional
    public void addToCart(Long userId, Long productId, Integer quantityToAdd) {
        Cart cart = getCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem existingItem = cart.getCartItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        int totalRequestedQty = (existingItem != null ? existingItem.getQuantity() : 0) + quantityToAdd;

        // Perfect Logic: လက်ရှိ Inventory အမှန်တကယ်ကျန်တာကို Lock ချပြီး စစ်ပါ
        validateAndReserveStock(productId, totalRequestedQty);

        if (existingItem != null) {
            existingItem.setQuantity(totalRequestedQty);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(null, cart, product, totalRequestedQty, product.getPrice());
            cartItemRepository.save(newItem);
        }
    }

    private void validateAndReserveStock(Long productId, Integer totalQty) {
        List<Recipe> recipes = recipeRepository.findByProductId(productId);
        
        for (Recipe recipe : recipes) {
            // Inventory ကို PESSIMISTIC_WRITE နဲ့ Lock ချမှ Concurrent access မှာ စာရင်းမမှားမှာပါ
            Inventory inv = inventoryRepository.findByIdWithLock(recipe.getInventory().getId());
            double required = recipe.getQuantity() * totalQty;
            
            if (inv.getQuantity() < required) {
                throw new RuntimeException("Stock Out: " + inv.getName());
            }
        }
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
    }
}