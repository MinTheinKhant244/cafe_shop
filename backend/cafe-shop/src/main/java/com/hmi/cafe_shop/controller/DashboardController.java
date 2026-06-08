package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.entity.Dashboard;
import com.hmi.cafe_shop.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*") // Front-end နှင့် ချိတ်ဆက်ရန်
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // ၁။ Dashboard အကျဉ်းချုပ် (Cards များအတွက်)
    @GetMapping("/summary")
    public ResponseEntity<Dashboard> getSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    // ၂။ ရောင်းအားလမ်းကြောင်း (Chart များအတွက်)
    @GetMapping("/sales-trend")
    public ResponseEntity<?> getSalesTrend(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(dashboardService.getSalesTrend(days));
    }

    @GetMapping("/popular-products")
    public ResponseEntity<?> getPopularProducts() {
        return ResponseEntity.ok(dashboardService.getTopProducts());
    }
}