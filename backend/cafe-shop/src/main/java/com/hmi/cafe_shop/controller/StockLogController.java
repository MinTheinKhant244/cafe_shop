package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.StockLog;
import com.hmi.cafe_shop.service.StockLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock-logs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StockLogController {

    private final StockLogService stockLogService;

    @PostMapping("/log")
    public ResponseEntity<StockLog> createLog(@RequestBody StockLog log) {
        return ResponseEntity.ok(stockLogService.logStockChange(log));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockLog>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(stockLogService.getLogsByProduct(productId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<StockLog>> getAll() {
        return ResponseEntity.ok(stockLogService.getAllLogs());
    }
    
//    @GetMapping("/expiring-soon")
//    public ResponseEntity<List<StockLog>> getExpiringSoon(@RequestParam(defaultValue = "15") int days) {
//        return ResponseEntity.ok(stockLogService.getExpiringProducts(days));
//    }

    @PostMapping("/write-off/{id}")
    public ResponseEntity<String> writeOff(@PathVariable Long id, @RequestParam String remarks) {
        stockLogService.writeOffExpiredStock(id, remarks);
        return ResponseEntity.ok("Expired stock written off successfully!");
    }
}