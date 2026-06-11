package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Dashboard;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface DashboardService {

    // MAIN SUMMARY (CARDS)
    Dashboard getDashboardSummary();

    // SALES TREND (CHART)
    List<Map<String, Object>> getSalesTrend(int days);

    // TOP SELLING PRODUCTS
    List<Map<String, Object>> getTopProducts();

    // OPTIONAL (RECOMMENDED ADDITIONS)
    Double getTodayRevenue(LocalDate date);

    Long getTodayOrders(LocalDate date);

    Long getPendingOrders();
}