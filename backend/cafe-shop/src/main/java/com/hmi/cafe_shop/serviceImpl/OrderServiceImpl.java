package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.StockCheckRequest;
import com.hmi.cafe_shop.dto.StockCheckResponse;
import com.hmi.cafe_shop.entity.*;
import com.hmi.cafe_shop.repository.*;
import com.hmi.cafe_shop.service.OrderService;
import com.hmi.cafe_shop.util.InvoiceGenerator;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;

    // ⭐ Stock Check Implementation
    @Override
    public StockCheckResponse checkStockAvailability(StockCheckRequest request) {
        List<StockCheckResponse.StockIssue> issues = new ArrayList<>();
        
        for (StockCheckRequest.OrderItemDto item : request.getItems()) {
            Long productId = item.getProduct().getId();
            String productName = item.getProduct().getName();
            Integer quantity = item.getQuantity();
            
            List<Recipe> recipes = recipeRepository.findByProductId(productId);
            
            for (Recipe recipe : recipes) {
                Inventory inventory = recipe.getInventory();
                Double requiredQty = recipe.getQuantity() * quantity;
                Double availableQty = inventory.getQuantity();
                
                if (availableQty < requiredQty) {
                    issues.add(new StockCheckResponse.StockIssue(
                        productName,
                        inventory.getName(),
                        availableQty,
                        requiredQty
                    ));
                }
            }
        }
        
        if (!issues.isEmpty()) {
            return new StockCheckResponse(false, issues);
        }
        
        return new StockCheckResponse(true, new ArrayList<>());
    }

    @Override
    @Transactional
    public Order createOrder(Order order) {
        // 1. Stock ကို အရင်စစ်ဆေးပါ
        for (OrderItem item : order.getOrderItems()) {
            Long productId = item.getProduct().getId();
            List<Recipe> recipes = recipeRepository.findByProductId(productId);
            
            for (Recipe recipe : recipes) {
                Inventory inv = recipe.getInventory();
                Double neededQty = recipe.getQuantity() * item.getQuantity();
                
                if (inv.getQuantity() < neededQty) {
                    throw new RuntimeException("Insufficient stock for " + inv.getName() + 
                        ". Available: " + inv.getQuantity() + ", Required: " + neededQty);
                }
            }
        }
        
        // 2. Generate Invoice Number
        order.setInvoiceNo(InvoiceGenerator.generateInvoiceNo());
        
        // 3. Save Order first to get ID
        Order savedOrder = orderRepository.save(order);
        
        // 4. Process Order Items and Deduct Stock
        for (OrderItem item : savedOrder.getOrderItems()) {
            Long productId = item.getProduct().getId();
            List<Recipe> recipes = recipeRepository.findByProductId(productId);
            
            for (Recipe recipe : recipes) {
                Inventory inv = recipe.getInventory();
                Double neededQty = recipe.getQuantity() * item.getQuantity();
                
                // Deduct stock
                inv.setQuantity(inv.getQuantity() - neededQty);
                inventoryRepository.save(inv);
                
                // Optional: Create stock transaction log
                // stockTransactionRepository.save(createTransaction(inv, -neededQty, savedOrder));
            }
            
            item.setOrder(savedOrder);
        }
        
        // 5. Save updated order with items
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
    
    @Override
    @Transactional
    public void deductStockForOrder(Order order) {
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return;
        }

        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            Integer quantity = item.getQuantity();

            // Product တစ်ခုချင်းစီအတွက် Recipe စာရင်းကို ဆွဲထုတ်ပါ
            List<Recipe> recipes = recipeRepository.findByProductId(product.getId());

            for (Recipe recipe : recipes) {
                Inventory ingredient = recipe.getInventory();
                double amountToDeduct = recipe.getQuantity() * quantity;

                // ကုန်ကြမ်းလက်ကျန် စစ်ဆေးခြင်း
                if (ingredient.getQuantity() < amountToDeduct) {
                    throw new RuntimeException("Insufficient stock for ingredient:" + ingredient.getName());
                }
                ingredient.setQuantity(ingredient.getQuantity() - amountToDeduct);
                
                if (ingredient.getQuantity() <= ingredient.getLowStockThreshold()) {
                    System.out.println("Alert: " + ingredient.getName() + " ကုန်ခါနီးနေပါပြီ။");
                }

                inventoryRepository.save(ingredient);
                
             // Transaction log ကိုပါ ဆက်လက်မှတ်တမ်းတင်ပါ (သင်၏မူလ code အတိုင်း)
            }
        }
    }

}