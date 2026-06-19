package com.hmi.cafe_shop.controller;

import com.hmi.cafe_shop.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    // Complete dashboard
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        return ResponseEntity.ok(dashboardService.getDashboardSummary());
    }

    // Today stats
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayStats() {
        return ResponseEntity.ok(dashboardService.getTodayStats());
    }

    // Weekly stats
    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyStats() {
        return ResponseEntity.ok(dashboardService.getWeeklyStats());
    }

    // Monthly stats
    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyStats() {
        return ResponseEntity.ok(dashboardService.getMonthlyStats());
    }

    // Overall stats
    @GetMapping("/overall")
    public ResponseEntity<Map<String, Object>> getOverallStats() {
        return ResponseEntity.ok(dashboardService.getOverallStats());
    }

    // Recent orders
    @GetMapping("/recent-orders")
    public ResponseEntity<?> getRecentOrders(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentOrders(limit));
    }

    // Top products
    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(dashboardService.getTopProducts(limit));
    }

    // Sales trend
    @GetMapping("/sales-trend")
    public ResponseEntity<?> getSalesTrend(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(dashboardService.getSalesTrend(days));
    }

    // Low stock alerts
    @GetMapping("/low-stock")
    public ResponseEntity<?> getLowStockItems() {
        return ResponseEntity.ok(dashboardService.getLowStockItems());
    }
}