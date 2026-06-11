package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin("*")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAll() {
        return ResponseEntity.ok(inventoryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inventory> getById(@PathVariable Long id) {
        return inventoryService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Inventory> create(@RequestBody Inventory inventory) {
        return ResponseEntity.ok(inventoryService.save(inventory));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inventory> update(
            @PathVariable Long id,
            @RequestBody Inventory inventory) {

        return ResponseEntity.ok(inventoryService.update(id, inventory));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Inventory>> lowStock() {
        return ResponseEntity.ok(inventoryService.getLowStockProducts());
    }
}