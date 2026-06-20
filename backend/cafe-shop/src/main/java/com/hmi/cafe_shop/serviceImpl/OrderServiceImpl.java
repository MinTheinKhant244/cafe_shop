package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.OrderRequestDTO;
import com.hmi.cafe_shop.dto.StockCheckRequest;
import com.hmi.cafe_shop.dto.StockCheckResponse;
import com.hmi.cafe_shop.entity.*;
import com.hmi.cafe_shop.exception.OrderNotFoundException;
import com.hmi.cafe_shop.repository.*;
import com.hmi.cafe_shop.service.OrderService;
import com.hmi.cafe_shop.util.InvoiceGenerator;
import java.util.stream.Collectors; 
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

	private final PaymentRepository paymentRepository;
	private final TableRepository tableRepository;
	private final ProductRepository productRepository;
	private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    // ⭐ Stock Check Implementation (Read-only transaction)
    @Override
    @Transactional(readOnly = true)
    public StockCheckResponse checkStockAvailability(StockCheckRequest request) {
        // Validation
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            log.warn("Stock check request with no items");
            return new StockCheckResponse(true, new ArrayList<>());
        }
        
        List<StockCheckResponse.StockIssue> issues = new ArrayList<>();
        
        for (StockCheckRequest.OrderItemDto item : request.getItems()) {
            // Validate item
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                log.error("Invalid order item: product is null or missing ID");
                continue;
            }
            
            Long productId = item.getProduct().getId();
            String productName = item.getProduct().getName();
            Integer quantity = item.getQuantity();
            
            // Validate quantity
            if (quantity == null || quantity <= 0) {
                log.warn("Invalid quantity for product: {}, quantity: {}", productName, quantity);
                continue;
            }
            
            List<Recipe> recipes = recipeRepository.findByProductId(productId);
            
            // Check if product has recipe
            if (recipes.isEmpty()) {
                log.warn("No recipe found for product: {}", productName);
                issues.add(new StockCheckResponse.StockIssue(
                    productName,
                    "No recipe defined",
                    0.0,
                    0.0
                ));
                continue;
            }
            
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
                    log.debug("Stock issue: {} needs {} of {} but only {} available", 
                        productName, requiredQty, inventory.getName(), availableQty);
                }
            }
        }
        
        if (!issues.isEmpty()) {
            log.warn("Stock check failed with {} issues", issues.size());
            return new StockCheckResponse(false, issues);
        }
        
        log.info("Stock check passed for all items");
        return new StockCheckResponse(true, new ArrayList<>());
    }

    @Override
    @Transactional
    public Order createOrder(OrderRequestDTO request) {
        log.info("Creating new order");
        
        // 1. Validate request
        if (request == null) {
            throw new IllegalArgumentException("Order request cannot be null");
        }
        
        if (request.getOrderItems() == null || request.getOrderItems().isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item");
        }
        
        // 2. Get User from ID
        User user = userRepository.findById(request.getCreatedBy())
            .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getCreatedBy()));
        
        // 3. Get Table from ID (if DINE_IN)
        TableEntity table = null;
        String combinedTablesInfo = null;
        
        if (request.getTableId() != null) {
            table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new RuntimeException("Table not found with ID: " + request.getTableId()));
            
            // Check table availability
            if (!"AVAILABLE".equals(table.getStatus())) {
                throw new RuntimeException("Table is not available. Current status: " + table.getStatus());
            }
            
            if (table.isMaster() && table.getSubTables() != null && !table.getSubTables().isEmpty()) {
                StringBuilder combined = new StringBuilder();
                combined.append(table.getTableNo()); 
                
                for (TableEntity subTable : table.getSubTables()) {
                    combined.append(", ").append(subTable.getTableNo());
                }
                combinedTablesInfo = combined.toString();
                
                log.info("Master table {} has {} sub table(s). Combined: {}", 
                    table.getTableNo(), table.getSubTables().size(), combinedTablesInfo);
            } else {
                // Single table (not master or no sub tables)
                combinedTablesInfo = table.getTableNo();
            }
        }
        
        // 4. Stock check before processing
        for (OrderRequestDTO.OrderItemDTO itemDTO : request.getOrderItems()) {
            // Only Product (no Inventory)
            if (itemDTO.getProductId() == null) {
                throw new RuntimeException("Product ID is required");
            }
            
            Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemDTO.getProductId()));
            
            // Check stock for all ingredients of this product
            List<Recipe> recipes = recipeRepository.findByProductId(product.getId());
            if (recipes.isEmpty()) {
                log.warn("Product {} has no recipe, skipping stock check", product.getId());
            } else {
                for (Recipe recipe : recipes) {
                    Inventory inventory = recipe.getInventory();
                    double requiredQuantity = recipe.getQuantity() * itemDTO.getQuantity();
                    
                    if (inventory.getQuantity() < requiredQuantity) {
                        throw new RuntimeException("Insufficient stock for ingredient: " + inventory.getName() + 
                            ". Available: " + inventory.getQuantity() + ", Required: " + requiredQuantity +
                            " (Product: " + product.getName() + ")");
                    }
                }
            }
        }
        
        // 5. Create Order Entity
        Order order = new Order();
        order.setCreatedBy(user);
        order.setTable(table);
        order.setTotalAmount(request.getTotalAmount());
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "PENDING");
        order.setOrderSource(request.getOrderSource());
        order.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");
        order.setOrderNote(request.getOrderNote());
        order.setPaymentMethod(request.getPaymentMethod());
        
        // ✅ Set combined tables info (table numbers instead of IDs)
        if (combinedTablesInfo != null) {
            order.setCombinedTables(combinedTablesInfo);
            log.debug("Combined tables set to: {}", combinedTablesInfo);
        } else if (request.getCombinedTables() != null) {
            // If client provided combined tables, use it
            order.setCombinedTables(request.getCombinedTables());
        }
        
        // 6. Generate Invoice Number
        String invoiceNo = InvoiceGenerator.generateInvoiceNo();
        order.setInvoiceNo(invoiceNo);
        log.debug("Generated invoice number: {}", invoiceNo);
        
        // 7. Create Order Items and Deduct Stock
        List<OrderItem> orderItems = request.getOrderItems().stream()
            .map(itemDTO -> {
                // Only Product (no Inventory)
                if (itemDTO.getProductId() == null) {
                    throw new RuntimeException("Product ID is required");
                }
                
                Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + itemDTO.getProductId()));
                
                List<Recipe> recipes = recipeRepository.findByProductId(product.getId());
                if (recipes.isEmpty()) {
                    log.warn("Product {} has no recipe, skipping stock deduction", product.getId());
                } else {
                    for (Recipe recipe : recipes) {
                        Inventory inventory = recipe.getInventory();
                        double requiredQuantity = recipe.getQuantity() * itemDTO.getQuantity();
                        
                        double oldQuantity = inventory.getQuantity();
                        double newQuantity = oldQuantity - requiredQuantity;
                        inventory.setQuantity(newQuantity);
                        inventoryRepository.save(inventory);
                        
                        createInventoryTransaction(
                            inventory,
                            "STOCK_OUT",                        
                            -requiredQuantity,                   
                            inventory.getCurrentPrice(),         
                            oldQuantity,                        
                            newQuantity,                        
                            invoiceNo,                          
                            "Stock deduction for product: " + product.getName() + " (Qty: " + itemDTO.getQuantity() + ")",
                            user.getName()                  
                        );
                        
                        log.debug("Deducted {} of {} for product {}. Old: {}, New: {}", 
                            requiredQuantity, inventory.getName(), product.getName(), oldQuantity, newQuantity);
                    }
                }
                
                // Create OrderItem
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setProduct(product);
                orderItem.setQuantity(itemDTO.getQuantity());
                orderItem.setPrice(itemDTO.getPrice());
                
                return orderItem;
            })
            .collect(Collectors.toList());
        
        order.setOrderItems(orderItems);
        
        // 8. Update table status
        if (table != null) {
            table.setStatus("OCCUPIED");
            tableRepository.save(table);
            log.debug("Table {} status updated to OCCUPIED", table.getTableNo());
            
            // ✅ Also update sub tables status if master
            if (table.isMaster() && table.getSubTables() != null && !table.getSubTables().isEmpty()) {
                for (TableEntity subTable : table.getSubTables()) {
                    subTable.setStatus("OCCUPIED");
                    tableRepository.save(subTable);
                    log.debug("Sub table {} status updated to OCCUPIED", subTable.getTableNo());
                }
            }
        }
        
        // 9. Save Order
        Order savedOrder = orderRepository.save(order);
        log.debug("Order saved with ID: {}", savedOrder.getId());
        
        log.info("Order created successfully with invoice: {}", invoiceNo);
        return savedOrder;
    }

    @Override
    @Transactional
    public void deductStockForOrder(Order order) {
        log.debug("Deducting stock for order ID: {}", order.getId());
        
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            log.warn("Order {} has no items, skipping stock deduction", order.getId());
            return;
        }

        for (OrderItem item : order.getOrderItems()) {
            // Only Product
            if (item.getProduct() != null) {
                List<Recipe> recipes = recipeRepository.findByProductId(item.getProduct().getId());
                if (recipes.isEmpty()) {
                    log.warn("Product {} has no recipe, skipping stock deduction", item.getProduct().getId());
                } else {
                    for (Recipe recipe : recipes) {
                        Inventory inventory = recipe.getInventory();
                        double requiredQuantity = recipe.getQuantity() * item.getQuantity();
                        
                        double oldQuantity = inventory.getQuantity();
                        double newQuantity = oldQuantity - requiredQuantity;
                        inventory.setQuantity(newQuantity);
                        inventoryRepository.save(inventory);
                        
                        createInventoryTransaction(
                            inventory,
                            "STOCK_OUT",
                            -requiredQuantity,
                            inventory.getCurrentPrice(),
                            oldQuantity,
                            newQuantity,
                            order.getInvoiceNo(),
                            "Stock deduction for order: " + order.getInvoiceNo(),
                            "SYSTEM"  // or get current user
                        );
                        
                        log.debug("Deducted {} of {} for order {}. Old: {}, New: {}", 
                            requiredQuantity, inventory.getName(), order.getInvoiceNo(), oldQuantity, newQuantity);
                    }
                }
            }
        }
        
        log.info("Stock deduction completed for order ID: {}", order.getId());
    }

    private void createInventoryTransaction(
            Inventory inventory,
            String transactionType,
            Double quantity,
            Double unitPrice,
            Double beforeQuantity,
            Double afterQuantity,
            String referenceNo,
            String remark,
            String createdBy) {
        
        try {
            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setInventory(inventory);
            transaction.setTransactionType(transactionType);
            transaction.setQuantity(quantity);
            transaction.setUnitPrice(unitPrice != null ? unitPrice : inventory.getCurrentPrice());
            transaction.setBeforeQuantity(beforeQuantity);
            transaction.setAfterQuantity(afterQuantity);
            transaction.setReferenceNo(referenceNo);
            transaction.setRemark(remark);
            transaction.setCreatedBy(createdBy != null ? createdBy : "SYSTEM");
            transaction.setTransactionDate(LocalDateTime.now());
            
            inventoryTransactionRepository.save(transaction);
            log.debug("Created inventory transaction for {}: {} ({} → {})", 
                inventory.getName(), quantity, beforeQuantity, afterQuantity);
        } catch (Exception e) {
            log.error("Failed to create inventory transaction: {}", e.getMessage());
            // Don't throw exception - transaction is not critical for order
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        log.debug("Fetching all orders");
        return orderRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> getById(Long id) {
        log.debug("Fetching order by ID: {}", id);
        return orderRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> getByInvoice(String invoiceNo) {
        log.debug("Fetching order by invoice: {}", invoiceNo);
        return orderRepository.findByInvoiceNo(invoiceNo);
    }

 // UPDATE STATUS - GENERAL (Admin/Cashier)
 @Override
 @Transactional
 public Order updateStatus(Long id, String status) {
     log.info("Updating order {} status to: {}", id, status);
     
     if (status == null || status.trim().isEmpty()) {
         throw new IllegalArgumentException("Status cannot be null or empty");
     }
     
     Order order = orderRepository.findById(id)
             .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + id));
     
     String oldStatus = order.getStatus();
     
     // ============================================================
     // ✅ CASE 1: Changing to CANCELLED → Restore Stock
     // ============================================================
     if ("CANCELLED".equals(status)) {
         log.info("Order {} is being cancelled. Restoring stock...", id);
         restoreStockForOrder(order);
         
         // Free table if DINE_IN
         if (order.getTable() != null) {
             order.getTable().setStatus("AVAILABLE");
             tableRepository.save(order.getTable());
             
             if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                 for (TableEntity subTable : order.getTable().getSubTables()) {
                     subTable.setStatus("AVAILABLE");
                     tableRepository.save(subTable);
                 }
             }
             log.info("Table {} freed for cancelled order", order.getTable().getTableNo());
         }
     }
     
     // ============================================================
     // ✅ CASE 2: Changing FROM CANCELLED to another status → Deduct Stock Again
     // ============================================================
     if ("CANCELLED".equals(oldStatus) && !"CANCELLED".equals(status)) {
         log.info("Order {} is being restored from CANCELLED to {}. Deducting stock again...", id, status);
         
         // Deduct stock again (reverse of restore)
         deductStockForOrder(order);
         
         // Reserve table if DINE_IN
         if (order.getTable() != null) {
             order.getTable().setStatus("OCCUPIED");
             tableRepository.save(order.getTable());
             
             if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                 for (TableEntity subTable : order.getTable().getSubTables()) {
                     subTable.setStatus("OCCUPIED");
                     tableRepository.save(subTable);
                 }
             }
             log.info("Table {} reserved for restored order", order.getTable().getTableNo());
         }
     }
     
     //  CASE 3: Changing to COMPLETED → Free Table
     if ("COMPLETED".equals(status) && order.getTable() != null) {
         if (!"COMPLETED".equals(oldStatus)) {
             order.getTable().setStatus("AVAILABLE");
             tableRepository.save(order.getTable());
             
             if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                 for (TableEntity subTable : order.getTable().getSubTables()) {
                     subTable.setStatus("AVAILABLE");
                     tableRepository.save(subTable);
                 }
             }
             log.info("Table {} freed for completed order", order.getTable().getTableNo());
         }
     }
     
     // ✅ CASE 4: Changing FROM COMPLETED to another status → Reserve Table
     if ("COMPLETED".equals(oldStatus) && !"COMPLETED".equals(status) && !"CANCELLED".equals(status)) {
         log.info("Order {} is being changed from COMPLETED to {}. Reserving table...", id, status);
         
         if (order.getTable() != null) {
             order.getTable().setStatus("OCCUPIED");
             tableRepository.save(order.getTable());
             
             if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                 for (TableEntity subTable : order.getTable().getSubTables()) {
                     subTable.setStatus("OCCUPIED");
                     tableRepository.save(subTable);
                 }
             }
             log.info("Table {} reserved for order", order.getTable().getTableNo());
         }
     }
     
     order.setStatus(status);
     Order updatedOrder = orderRepository.save(order);
     
     log.info("Order status updated from '{}' to '{}' for order ID: {}", oldStatus, status, id);
     return updatedOrder;
 }

    @Override
    @Transactional
    public Order updatePayment(Long id, String paymentMethod, String paymentStatus) {
        log.info("Updating order {} payment status to: {}", id, paymentStatus);
        
        if (paymentStatus == null || paymentStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment status cannot be null or empty");
        }
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + id));
        
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(paymentStatus);
        Order updatedOrder = orderRepository.save(order);
        
        return updatedOrder;
    }
    
    // ========== 🆕 CASHIER API METHODS ==========

    /**
     * 1. Get cashier orders with filters
     */
    @Override
    @Transactional(readOnly = true)
    public List<Order> getCashierOrders(String status, String orderSource, 
                                        LocalDate startDate, LocalDate endDate, 
                                        String search) {
        log.info("🔍 Service - orderSource: '{}'", orderSource);
        log.info("🔍 Service - status: '{}'", status);
        
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        
        // ✅ "ALL" ကိုပဲ null ပြောင်းပါ
        String source = null;
        if (orderSource != null && !"ALL".equals(orderSource) && !"".equals(orderSource)) {
            source = orderSource;
        }
        log.info("🔍 Service - source after conversion: '{}'", source);
        
        List<Order> orders = orderRepository.findCashierOrders(status, source, startDateTime, endDateTime, search);
        
        log.info("📦 Service - Found {} orders", orders.size());
        
        return orders;
    }
    
    /**
     * 2. Get order summary for cashier dashboard
     */
//    @Override
//    @Transactional(readOnly = true)
//    public OrderSummaryDTO getOrderSummary() {
//        log.info("Fetching order summary for cashier dashboard");
//        
//        LocalDate today = LocalDate.now();
//        
//        // Get today's order summary from repository
//        Map<String, Object> summary = orderRepository.findTodayOrderSummary(today);
//        
//        // ✅ Updated field names for 4 statuses
//        long pendingOrders = summary.get("pendingOrders") != null ? 
//            ((Number) summary.get("pendingOrders")).longValue() : 0;
//        long preparingOrders = summary.get("preparingOrders") != null ? 
//            ((Number) summary.get("preparingOrders")).longValue() : 0;
//        long completedOrders = summary.get("completedOrders") != null ? 
//            ((Number) summary.get("completedOrders")).longValue() : 0;
//        long cancelledOrders = summary.get("cancelledOrders") != null ? 
//            ((Number) summary.get("cancelledOrders")).longValue() : 0;
//        long pendingPaymentOrders = summary.get("pendingPaymentOrders") != null ? 
//            ((Number) summary.get("pendingPaymentOrders")).longValue() : 0;
//        double todayRevenue = summary.get("todayRevenue") != null ? 
//            ((Number) summary.get("todayRevenue")).doubleValue() : 0;
//        long totalOrdersToday = summary.get("totalOrdersToday") != null ? 
//            ((Number) summary.get("totalOrdersToday")).longValue() : 0;
//        
//        return new OrderSummaryDTO(
//            pendingOrders,
//            preparingOrders,
//            completedOrders,
//            cancelledOrders,
//            pendingPaymentOrders,
//            todayRevenue,
//            totalOrdersToday
//        );
//    }

    /**
     * 3. Update order status for cashier (with validation)
     * Status Flow: PENDING → PREPARING → COMPLETED
     *             PENDING → CANCELLED
     *             PREPARING → CANCELLED
     * 
     * ✅ Cancelled ဖြစ်သွားရင် Stock ပြန်ထည့်မယ်
     * ✅ COMPLETED ဖြစ်သွားရင် Table ကို FREE လုပ်မယ်
     */
    @Override
    @Transactional
    public Order updateCashierOrderStatus(Long id, String newStatus) {
        log.info("Cashier updating order {} status to: {}", id, newStatus);
        
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be null or empty");
        }
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + id));
        
        String oldStatus = order.getStatus();
        
        // ✅ Validate status transition
        validateStatusTransition(oldStatus, newStatus);
        
        // ✅ If changing to CANCELLED, restore stock (undo the deduction)
        if ("CANCELLED".equals(newStatus)) {
            log.info("Order {} is being cancelled. Restoring stock...", id);
            restoreStockForOrder(order);
            
            // Free table if DINE_IN
            if (order.getTable() != null) {
                order.getTable().setStatus("AVAILABLE");
                tableRepository.save(order.getTable());
                
                if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                    for (TableEntity subTable : order.getTable().getSubTables()) {
                        subTable.setStatus("AVAILABLE");
                        tableRepository.save(subTable);
                    }
                }
                log.info("Table {} freed for cancelled order", order.getTable().getTableNo());
            }
        }
        
        // ✅ If changing from PENDING/PREPARING to COMPLETED, free table
        if ("COMPLETED".equals(newStatus) && order.getTable() != null) {
            order.getTable().setStatus("AVAILABLE");
            tableRepository.save(order.getTable());
            
            if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                for (TableEntity subTable : order.getTable().getSubTables()) {
                    subTable.setStatus("AVAILABLE");
                    tableRepository.save(subTable);
                }
            }
            log.info("Table {} freed for completed order", order.getTable().getTableNo());
        }
        
        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        log.info("Order {} status updated from '{}' to '{}'", id, oldStatus, newStatus);
        
        return updatedOrder;
    }

    /**
     * 4. Cancel order (restore stock, free table)
     * Only PENDING orders can be cancelled
     */
    @Override
    @Transactional
    public Order cancelOrder(Long id) {
        log.info("Cancelling order: {}", id);
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + id));
        
        // ✅ Only PENDING orders can be cancelled
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException(
                "Only PENDING orders can be cancelled. Current status: " + order.getStatus()
            );
        }
        
        if ("CANCELLED".equals(order.getStatus())) {
            throw new IllegalStateException("Order is already cancelled");
        }
        
        // ✅ Restore stock (undo deduction)
        restoreStockForOrder(order);
        
        // Free table
        if (order.getTable() != null) {
            order.getTable().setStatus("AVAILABLE");
            tableRepository.save(order.getTable());
            
            if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
                for (TableEntity subTable : order.getTable().getSubTables()) {
                    subTable.setStatus("AVAILABLE");
                    tableRepository.save(subTable);
                }
            }
            log.info("Table {} freed for cancelled order", order.getTable().getTableNo());
        }
        
        order.setStatus("CANCELLED");
        Order cancelledOrder = orderRepository.save(order);
        log.info("Order {} cancelled successfully", id);
        
        return cancelledOrder;
    }
    
    // ==========  PAYMENT METHOD ==========

    /**
     * Process full payment - Update payment status AND complete order
     */
//    @Override
//    @Transactional
//    public Order processPayment(Long id, String paymentMethod, Double cashReceived) {
//        log.info("Processing payment for order: {}", id);
//        
//        Order order = orderRepository.findById(id)
//                .orElseThrow(() -> new OrderNotFoundException("Order not found with ID: " + id));
//        
//        // Validate order can be paid
//        if ("COMPLETED".equals(order.getStatus())) {
//            throw new IllegalStateException("Order is already completed");
//        }
//        if ("CANCELLED".equals(order.getStatus())) {
//            throw new IllegalStateException("Cannot pay for cancelled order");
//        }
//        if ("PAID".equals(order.getPaymentStatus())) {
//            throw new IllegalStateException("Order is already paid");
//        }
//        
//        // Validate cash payment
//        if ("CASH".equals(paymentMethod) && cashReceived != null) {
//            if (cashReceived < order.getTotalAmount()) {
//                throw new IllegalArgumentException(
//                    "Cash received (" + cashReceived + ") is less than total amount (" + order.getTotalAmount() + ")"
//                );
//            }
//            double change = cashReceived - order.getTotalAmount();
//            log.info("Cash payment: Received {}, Change: {}", cashReceived, change);
//        }
//        
//        // Update payment
//        order.setPaymentMethod(paymentMethod != null ? paymentMethod : "CASH");
//        order.setPaymentStatus("PAID");
//        
//        // If order is still PENDING or PREPARING, mark as COMPLETED
//        if (!"COMPLETED".equals(order.getStatus())) {
//            order.setStatus("COMPLETED");
//            
//            // Free table if DINE_IN
//            if (order.getTable() != null) {
//                order.getTable().setStatus("AVAILABLE");
//                tableRepository.save(order.getTable());
//                
//                if (order.getTable().isMaster() && order.getTable().getSubTables() != null) {
//                    for (TableEntity subTable : order.getTable().getSubTables()) {
//                        subTable.setStatus("AVAILABLE");
//                        tableRepository.save(subTable);
//                    }
//                }
//                log.info("Table {} freed after payment", order.getTable().getTableNo());
//            }
//        }
//        
//        Order savedOrder = orderRepository.save(order);
//        log.info("Payment completed for order: {}", savedOrder.getInvoiceNo());
//        
//        return savedOrder;
//    }

//      Get pending payment orders
//    @Override
//    @Transactional(readOnly = true)
//    public List<Order> getPendingPaymentOrders(String orderSource) {
//        log.info("Fetching pending payment orders - source: {}", orderSource);
//        return orderRepository.findPendingPaymentOrders(orderSource);
//    }

//    Get today's revenue summary
//    @Override
//    @Transactional(readOnly = true)
//    public Map<String, Object> getTodayRevenue() {
//        log.info("Fetching today's revenue");
//        
//        LocalDate today = LocalDate.now();
//        LocalDateTime startOfDay = today.atStartOfDay();
//        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
//        
//        List<Order> todayOrders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
//        
//        long totalOrders = todayOrders.size();
//        long completedOrders = todayOrders.stream()
//                .filter(o -> "COMPLETED".equals(o.getStatus()))
//                .count();
//        long cancelledOrders = todayOrders.stream()
//                .filter(o -> "CANCELLED".equals(o.getStatus()))
//                .count();
//        
//        double totalRevenue = todayOrders.stream()
//                .filter(o -> "COMPLETED".equals(o.getStatus()))
//                .mapToDouble(Order::getTotalAmount)
//                .sum();
//        
//        double cashRevenue = todayOrders.stream()
//                .filter(o -> "COMPLETED".equals(o.getStatus()))
//                .filter(o -> "CASH".equals(o.getPaymentMethod()))
//                .mapToDouble(Order::getTotalAmount)
//                .sum();
//        
//        double cardRevenue = todayOrders.stream()
//                .filter(o -> "COMPLETED".equals(o.getStatus()))
//                .filter(o -> "CARD".equals(o.getPaymentMethod()) || "KPAY".equals(o.getPaymentMethod()) || "WAVE".equals(o.getPaymentMethod()))
//                .mapToDouble(Order::getTotalAmount)
//                .sum();
//        
//        Map<String, Object> revenue = new HashMap<>();
//        revenue.put("date", today.toString());
//        revenue.put("totalOrders", totalOrders);
//        revenue.put("completedOrders", completedOrders);
//        revenue.put("cancelledOrders", cancelledOrders);
//        revenue.put("totalRevenue", totalRevenue);
//        revenue.put("cashRevenue", cashRevenue);
//        revenue.put("cardRevenue", cardRevenue);
//        
//        return revenue;
//    }

    
 // ✅ Process payment and create Payment row in database
 // service/OrderService.java

    @Transactional
    public Payment processPayment(Long orderId, String paymentMethod, Double cashReceived) {
        log.info("Processing payment for order ID: {}", orderId);

        // 1. Get order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        // 2. Validate order status
        if ("PAID".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Order is already paid");
        }

        if ("CANCELLED".equals(order.getStatus())) {
            throw new RuntimeException("Cannot process payment for cancelled order");
        }

        // 3. Validate total amount
        if (order.getTotalAmount() == null || order.getTotalAmount() <= 0) {
            throw new RuntimeException("Invalid order total amount");
        }

        // 4. Validate payment method
        if (paymentMethod == null || paymentMethod.isEmpty()) {
            throw new RuntimeException("Payment method is required");
        }

        // 5. Create new Payment object
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setMethod(paymentMethod.toUpperCase());
        payment.setStatus("SUCCESS");
        payment.setTransactionNo(generateTransactionNo());
        payment.setPaymentDate(LocalDateTime.now());

        // 6. Cash logic
        if ("CASH".equalsIgnoreCase(paymentMethod)) {
            if (cashReceived == null || cashReceived <= 0) {
                throw new RuntimeException("Cash received is required for cash payment");
            }
            
            if (cashReceived < order.getTotalAmount()) {
                throw new RuntimeException("Cash received (" + cashReceived + 
                        ") is less than total amount (" + order.getTotalAmount() + ")");
            }
            
            payment.setCashReceived(cashReceived);
            payment.setChangeAmount(cashReceived - order.getTotalAmount());
            
            log.info("Cash payment - Received: {}, Change: {}", cashReceived, payment.getChangeAmount());
        } else {
            payment.setCashReceived(0.0);
            payment.setChangeAmount(0.0);
        }

        // 7. Update order status
        order.setPaymentStatus("PAID");
        order.setStatus("COMPLETED");
        order.setPaymentMethod(paymentMethod.toUpperCase());

        // 8. Save order and payment
        orderRepository.save(order);
        Payment savedPayment = paymentRepository.save(payment);

        log.info("✅ Payment processed successfully - Order: {}, Payment: {}, Amount: {}", 
                order.getInvoiceNo(), savedPayment.getTransactionNo(), savedPayment.getAmount());

        return savedPayment;
    }

    private String generateTransactionNo() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================

    /**
     * Validate status transition for 4 statuses
     * PENDING → PREPARING → COMPLETED
     * PENDING → CANCELLED
     * PREPARING → CANCELLED
     * 
     * ✅ COMPLETED → Nothing allowed
     * ✅ CANCELLED → Nothing allowed
     */
    private void validateStatusTransition(String currentStatus, String newStatus) {
        Map<String, List<String>> validTransitions = Map.of(
            "PENDING", List.of("PREPARING", "CANCELLED"),
            "PREPARING", List.of("COMPLETED", "CANCELLED"),
            "COMPLETED", List.of(),      // ✅ COMPLETED → nothing allowed
            "CANCELLED", List.of()       // ✅ CANCELLED → nothing allowed
        );
        
        List<String> allowed = validTransitions.get(currentStatus);
        if (allowed != null && !allowed.contains(newStatus)) {
            throw new IllegalStateException(
                "Cannot transition from '" + currentStatus + "' to '" + newStatus + 
                "'. Allowed transitions: " + allowed
            );
        }
    }

    /**
     * Restore stock when order is cancelled
     * ✅ ဒီ method က Order Cancelled ဖြစ်တဲ့အခါ Stock ပြန်ထည့်ပေးတယ်
     */
    private void restoreStockForOrder(Order order) {
        log.debug("Restoring stock for cancelled order: {}", order.getId());
        
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            log.warn("Order {} has no items, skipping stock restoration", order.getId());
            return;
        }

        for (OrderItem item : order.getOrderItems()) {
            if (item.getProduct() != null) {
                List<Recipe> recipes = recipeRepository.findByProductId(item.getProduct().getId());
                if (recipes.isEmpty()) {
                    log.warn("Product {} has no recipe, skipping stock restoration", item.getProduct().getId());
                } else {
                    for (Recipe recipe : recipes) {
                        Inventory inventory = recipe.getInventory();
                        double quantityToRestore = recipe.getQuantity() * item.getQuantity();
                        
                        double oldQuantity = inventory.getQuantity();
                        double newQuantity = oldQuantity + quantityToRestore;
                        inventory.setQuantity(newQuantity);
                        inventoryRepository.save(inventory);
                        
                        // ✅ Create transaction record with ORDER_CANCEL type
                        createInventoryTransaction(
                            inventory,
                            "ORDER_CANCEL",                    // ✅ Transaction type for cancellation
                            quantityToRestore,
                            inventory.getCurrentPrice(),
                            oldQuantity,
                            newQuantity,
                            order.getInvoiceNo(),
                            "Stock restored for cancelled order: " + order.getInvoiceNo(),
                            "SYSTEM"
                        );
                        
                        log.debug("Restored {} of {} for cancelled order. Old: {}, New: {}", 
                            quantityToRestore, inventory.getName(), oldQuantity, newQuantity);
                    }
                }
            }
        }
        
        log.info("Stock restoration completed for cancelled order ID: {}", order.getId());
    }
}