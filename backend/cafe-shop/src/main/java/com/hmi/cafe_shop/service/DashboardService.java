package com.hmi.cafe_shop.service;

import java.util.List;
import java.util.Map;

import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.Order;

public interface DashboardService {
    
    // Today stats
    Map<String, Object> getTodayStats();
    
    // Weekly stats
    Map<String, Object> getWeeklyStats();
    
    // Monthly stats
    Map<String, Object> getMonthlyStats();
    
    // Overall stats
    Map<String, Object> getOverallStats();
    
    // Recent orders
    List<Order> getRecentOrders(int limit);
    
    // Top selling products
    List<Object[]> getTopProducts(int limit);
    
    // Sales trend
    List<Object[]> getSalesTrend(int days);
    
    // Low stock alerts
    List<Inventory> getLowStockItems();
    
    // Complete dashboard
    Map<String, Object> getDashboardSummary();
}