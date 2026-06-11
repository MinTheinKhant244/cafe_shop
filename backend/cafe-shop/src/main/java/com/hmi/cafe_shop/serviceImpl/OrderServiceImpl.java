package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.*;
import com.hmi.cafe_shop.repository.*;
import com.hmi.cafe_shop.service.OrderService;
import com.hmi.cafe_shop.util.InvoiceGenerator;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public Order createOrder(Order order) {

        order.setInvoiceNo(InvoiceGenerator.generateInvoiceNo());

        Order savedOrder = orderRepository.save(order);

        // LOOP ORDER ITEMS
        for (OrderItem item : order.getOrderItems()) {

            Long productId = item.getProduct().getId();

            List<Recipe> recipes = recipeRepository.findByProductId(productId);

            if (recipes.isEmpty()) {
                throw new RuntimeException("No recipe found for product " + productId);
            }

            for (Recipe r : recipes) {

                Inventory inv = r.getInventory();

                Double neededQty = r.getQuantity() * item.getQuantity();

                if (inv.getQuantity() < neededQty) {
                    throw new RuntimeException("Insufficient stock");
                }

                inv.setQuantity(inv.getQuantity() - neededQty);
                inventoryRepository.save(inv);
            }

            item.setOrder(savedOrder);
        }

        return orderRepository.save(savedOrder);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Optional<Order> getById(Long id) {
        return orderRepository.findById(id);
    }

    @Override
    public Optional<Order> getByInvoice(String invoiceNo) {
        return orderRepository.findByInvoiceNo(invoiceNo);
    }

    @Override
    public Order updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Override
    public Order updatePayment(Long id, String paymentStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus(paymentStatus);
        return orderRepository.save(order);
    }
}