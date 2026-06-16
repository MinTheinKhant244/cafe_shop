package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.dto.StockTransactionRequest;
import com.hmi.cafe_shop.entity.InventoryTransaction;
import com.hmi.cafe_shop.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory-transactions")
@RequiredArgsConstructor
public class InventoryTransactionController {

    private final InventoryTransactionService transactionService;

    @PostMapping("/stock-in")
    public ResponseEntity<InventoryTransaction> stockIn(@RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(transactionService.stockIn(request));
    }

    @PostMapping("/stock-out")
    public ResponseEntity<InventoryTransaction> stockOut(@RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(transactionService.stockOut(request));
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryTransaction> adjust(@RequestBody StockTransactionRequest request) {
        return ResponseEntity.ok(transactionService.adjustStock(request));
    }

    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<List<InventoryTransaction>> getByInventory(@PathVariable Long inventoryId) {
        return ResponseEntity.ok(transactionService.getTransactionsByInventory(inventoryId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<InventoryTransaction>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(transactionService.getTransactionsByDateRange(start, end));
    }
}