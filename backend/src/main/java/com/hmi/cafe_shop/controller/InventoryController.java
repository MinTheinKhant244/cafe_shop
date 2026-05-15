package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.service.InventoryService; // Service ကို Import လုပ်ပါ
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor  // autowired အစားသုံးတာလို့ပြောတာဘဲ
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/status")
    public ResponseEntity<List<Inventory>> getInventoryStatus() {
        return ResponseEntity.ok(inventoryService.getAllInventoryStatus());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Inventory>> getLowStock() {
        return ResponseEntity.ok(inventoryService.getLowStockProducts());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<Inventory> getByProduct(@PathVariable Long productId) {
        return inventoryService.getInventoryByProductId(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}