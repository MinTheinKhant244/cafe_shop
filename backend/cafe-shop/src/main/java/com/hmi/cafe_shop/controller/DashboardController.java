package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Dashboard;
import com.hmi.cafe_shop.service.DashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<Dashboard> getSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    @GetMapping("/sales-trend")
    public ResponseEntity<?> getSalesTrend(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(dashboardService.getSalesTrend(days));
    }

    @GetMapping("/popular-products")
    public ResponseEntity<?> getPopularProducts() {
        return ResponseEntity.ok(dashboardService.getTopProducts());
    }
}