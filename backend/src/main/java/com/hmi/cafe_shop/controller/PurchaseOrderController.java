package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.PurchaseOrder;
import com.hmi.cafe_shop.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @PostMapping("/create")
    public ResponseEntity<PurchaseOrder> create(@RequestBody PurchaseOrder po) {
        return ResponseEntity.ok(poService.createPO(po));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PurchaseOrder>> getAll() {
        return ResponseEntity.ok(poService.getAllPOs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getById(@PathVariable Long id) {
        return poService.getPOById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/update-status/{id}")
    public ResponseEntity<PurchaseOrder> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(poService.updatePOStatus(id, status));
    }
}