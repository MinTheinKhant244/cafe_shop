package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.InventoryPriceHistory;
import com.hmi.cafe_shop.dto.InventoryTransaction;
import com.hmi.cafe_shop.dto.ProductStockStatusDTO;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.Product;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin("*")
public class InventoryController {

	private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAll() {
        List<Inventory> inventories = inventoryService.getAll();
        return ResponseEntity.ok(inventories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return inventoryService.getById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch inventory item: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Inventory inventory) {
        try {
            Inventory savedInventory = inventoryService.save(inventory);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedInventory);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to create inventory item: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Inventory inventory) {
        try {
            Inventory updatedInventory = inventoryService.update(id, inventory);
            return ResponseEntity.ok(updatedInventory);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Inventory item not found with id: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update inventory item: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            inventoryService.delete(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Inventory item deleted successfully");
            response.put("id", String.valueOf(id));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Inventory item not found with id: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete inventory item: " + e.getMessage()));
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<?> getLowStock() {
        try {
            List<Inventory> lowStockItems = inventoryService.getLowStockProducts();
            if (lowStockItems.isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "No low stock items found");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch low stock items: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String keyword) {
        try {
            List<Inventory> results = inventoryService.searchByName(keyword);
            if (results.isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "No items found matching: " + keyword);
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to search inventory: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        try {
            Inventory updated = inventoryService.updateStock(id, quantity);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Stock updated successfully");
            response.put("inventory", updated);
            response.put("newQuantity", updated.getQuantity());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Inventory item not found with id: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update stock: " + e.getMessage()));
        }
    }

    @GetMapping("/check-name")
    public ResponseEntity<?> checkNameExists(@RequestParam String name) {
        try {
            boolean exists = inventoryService.existsByName(name);
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to check name: " + e.getMessage()));
        }
    }

    @GetMapping("/below-threshold/{threshold}")
    public ResponseEntity<?> getBelowThreshold(@PathVariable Double threshold) {
        try {
            List<Inventory> items = inventoryService.getProductsBelowQuantity(threshold);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch items: " + e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/add-stock")
    public ResponseEntity<?> addStock(
            @PathVariable Long id,
            @RequestParam Double quantity,
            @RequestParam Double price,
            @RequestParam(required = false) String invoiceNo,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String performedBy) {
        try {
            Inventory updated = inventoryService.addStock(id, quantity, price, invoiceNo, notes, 
                performedBy != null ? performedBy : "system");
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Stock added successfully");
            response.put("inventory", updated);
            response.put("newQuantity", updated.getQuantity());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    // Remove Stock (Usage, Wastage, Return)
    @PostMapping("/{id}/remove-stock")
    public ResponseEntity<?> removeStock(
            @PathVariable Long id,
            @RequestParam Double quantity,
            @RequestParam String transactionType, // USAGE, WASTAGE, RETURN
            @RequestParam(required = false) String referenceId,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String performedBy) {
        try {
            Inventory updated = inventoryService.removeStock(id, quantity, transactionType, referenceId, notes,
                performedBy != null ? performedBy : "system");
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Stock removed successfully");
            response.put("inventory", updated);
            response.put("newQuantity", updated.getQuantity());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}/adjust-stock")
    public ResponseEntity<?> adjustStock(
            @PathVariable Long id,
            @RequestParam Double newQuantity,
            @RequestParam String reason,
            @RequestParam(required = false) String performedBy) {
        try {
            Inventory updated = inventoryService.adjustStock(id, newQuantity, reason,
                performedBy != null ? performedBy : "system");
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/product/{productId}/status")
    public ResponseEntity<ProductStockStatusDTO> getProductStockStatus(@PathVariable Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        return ResponseEntity.ok(inventoryService.getProductStockStatus(product));
    }
    
    // Get Transaction History
    @GetMapping("/{id}/transactions")
    public ResponseEntity<?> getTransactionHistory(@PathVariable Long id) {
        try {
            List<InventoryTransaction> transactions = inventoryService.getTransactionHistory(id);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch transactions: " + e.getMessage()));
        }
    }

    // Get Price History
    @GetMapping("/{id}/price-history")
    public ResponseEntity<?> getPriceHistory(@PathVariable Long id) {
        try {
            List<InventoryPriceHistory> history = inventoryService.getPriceHistory(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch price history: " + e.getMessage()));
        }
    }

    // Get Average Purchase Price
    @GetMapping("/{id}/average-price")
    public ResponseEntity<?> getAveragePurchasePrice(@PathVariable Long id) {
        try {
            Double avgPrice = inventoryService.getAveragePurchasePrice(id);
            Map<String, Object> response = new HashMap<>();
            response.put("averagePrice", avgPrice);
            response.put("inventoryId", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to calculate average price: " + e.getMessage()));
        }
    }

    // ✅ Get Total Stock Value
    @GetMapping("/total-value")
    public ResponseEntity<?> getTotalStockValue() {
        try {
            Double totalValue = inventoryService.getTotalStockValue();
            Map<String, Object> response = new HashMap<>();
            response.put("totalValue", totalValue);
            response.put("currency", "Ks");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to calculate total value: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return error;
    }
}