package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.PurchaseOrderItem;
import com.hmi.cafe_shop.service.PurchaseOrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-order-items")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PurchaseOrderItemController {

    private final PurchaseOrderItemService poItemService;

    @PostMapping("/add")
    public ResponseEntity<PurchaseOrderItem> add(@RequestBody PurchaseOrderItem item) {
        return ResponseEntity.ok(poItemService.addPOItem(item));
    }

    @GetMapping("/po/{poId}")
    public ResponseEntity<List<PurchaseOrderItem>> getByPOId(@PathVariable Long poId) {
        return ResponseEntity.ok(poItemService.getItemsByPOId(poId));
    }

    @PatchMapping("/update-received/{id}")
    public ResponseEntity<PurchaseOrderItem> updateReceived(@PathVariable Long id, @RequestParam Integer qtyReceived) {
        return ResponseEntity.ok(poItemService.updateReceivedQuantity(id, qtyReceived));
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        poItemService.deletePOItem(id);
        return ResponseEntity.ok("Item removed from Purchase Order");
    }
}