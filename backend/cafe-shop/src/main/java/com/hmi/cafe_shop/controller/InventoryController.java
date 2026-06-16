package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Inventory;
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

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAll() {
        List<Inventory> inventories = inventoryService.getAll();
        return ResponseEntity.ok(inventories);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Inventory>> getActiveOnly() {
        List<Inventory> activeItems = inventoryService.getActiveOnly();
        return ResponseEntity.ok(activeItems);
    }
    
    // ✅ Get inactive items only
    @GetMapping("/inactive")
    public ResponseEntity<List<Inventory>> getInactiveOnly() {
        List<Inventory> inactiveItems = inventoryService.getInactiveOnly();
        return ResponseEntity.ok(inactiveItems);
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
    
    // ✅ Activate endpoint
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        try {
            Inventory activated = inventoryService.activate(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Inventory item activated successfully");
            response.put("item", activated);
            response.put("status", "ACTIVE");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to activate inventory: " + e.getMessage()));
        }
    }
    
    // ✅ Deactivate endpoint
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            Inventory deactivated = inventoryService.deactivate(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Inventory item deactivated successfully");
            response.put("item", deactivated);
            response.put("status", "INACTIVE");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to deactivate inventory: " + e.getMessage()));
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
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

    // Get Total Stock Value
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