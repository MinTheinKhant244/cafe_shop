package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Dashboard;
import java.util.List;
import java.util.Map;

public interface DashboardService {
    Dashboard getDashboardSummary();
    List<Map<String, Object>> getSalesTrend(int days);
    List<Map<String, Object>> getTopProducts();
}