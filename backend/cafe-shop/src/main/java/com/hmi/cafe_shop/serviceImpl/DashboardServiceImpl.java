package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.repository.DashboardRepository;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final DashboardRepository dashboardRepository;
    private final TableRepository tableRepository;  
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Map<String, Object> getTodayStats() {
        log.info("Getting today stats...");
        
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        
        List<Object[]> statsData = dashboardRepository.getDashboardStatsByDateRange(startOfDay, endOfDay);
        List<Object[]> sourceStats = dashboardRepository.getOrderSourceStats(startOfDay, endOfDay);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("date", today.toString());
        
        if (!statsData.isEmpty()) {
            Object[] row = statsData.get(0);
            stats.put("totalOrders", row[0] != null ? ((Number) row[0]).longValue() : 0L);
            stats.put("totalRevenue", row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
            stats.put("pendingOrders", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            stats.put("preparingOrders", row[3] != null ? ((Number) row[3]).longValue() : 0L);
            stats.put("completedOrders", row[4] != null ? ((Number) row[4]).longValue() : 0L);
            stats.put("cancelledOrders", row[5] != null ? ((Number) row[5]).longValue() : 0L);
            stats.put("pendingPaymentOrders", row[6] != null ? ((Number) row[6]).longValue() : 0L);
            stats.put("uniqueCustomers", row[7] != null ? ((Number) row[7]).longValue() : 0L);
        }
        
        // ✅ Add order source stats
        Long dineInOrders = 0L;
        Long takeawayOrders = 0L;
        Long deliveryOrders = 0L;
        
        for (Object[] source : sourceStats) {
            String sourceName = (String) source[0];
            Long count = ((Number) source[1]).longValue();
            if ("DINE_IN".equals(sourceName)) {
                dineInOrders = count;
            } else if ("TAKEAWAY".equals(sourceName)) {
                takeawayOrders = count;
            } else if ("DELIVERY".equals(sourceName)) {
                deliveryOrders = count;
            }
        }
        
        stats.put("dineInOrders", dineInOrders);
        stats.put("takeawayOrders", takeawayOrders);
        stats.put("deliveryOrders", deliveryOrders);
        
        // Calculate average order value
        Long totalOrders = (Long) stats.get("totalOrders");
        Double totalRevenue = (Double) stats.get("totalRevenue");
        stats.put("averageOrderValue", totalOrders > 0 ? totalRevenue / totalOrders : 0.0);
        
        return stats;
    }

    @Override
    public Map<String, Object> getWeeklyStats() {
        log.info("Getting weekly stats...");
        
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(7);
        LocalDateTime startDate = weekStart.atStartOfDay();
        LocalDateTime endDate = today.atTime(23, 59, 59);
        
        List<Object[]> statsData = dashboardRepository.getDashboardStatsByDateRange(startDate, endDate);
        List<Object[]> sourceStats = dashboardRepository.getOrderSourceStats(startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("weekStart", weekStart.toString());
        stats.put("weekEnd", today.toString());
        
        if (!statsData.isEmpty()) {
            Object[] row = statsData.get(0);
            Long totalOrders = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            Double totalRevenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            Long uniqueCustomers = row[7] != null ? ((Number) row[7]).longValue() : 0L;
            
            stats.put("totalOrders", totalOrders);
            stats.put("totalRevenue", totalRevenue);
            stats.put("averageDailyRevenue", totalRevenue / 7);
            stats.put("totalCustomers", uniqueCustomers);
        } else {
            stats.put("totalOrders", 0L);
            stats.put("totalRevenue", 0.0);
            stats.put("averageDailyRevenue", 0.0);
            stats.put("totalCustomers", 0L);
        }
        
        // ✅ Add weekly order source stats
        Long dineInOrders = 0L;
        Long takeawayOrders = 0L;
        Long deliveryOrders = 0L;
        
        for (Object[] source : sourceStats) {
            String sourceName = (String) source[0];
            Long count = ((Number) source[1]).longValue();
            if ("DINE_IN".equals(sourceName)) {
                dineInOrders = count;
            } else if ("TAKEAWAY".equals(sourceName)) {
                takeawayOrders = count;
            } else if ("DELIVERY".equals(sourceName)) {
                deliveryOrders = count;
            }
        }
        
        stats.put("weeklyDineInOrders", dineInOrders);
        stats.put("weeklyTakeawayOrders", takeawayOrders);
        stats.put("weeklyDeliveryOrders", deliveryOrders);
        
        return stats;
    }

    @Override
    public Map<String, Object> getMonthlyStats() {
        log.info("Getting monthly stats...");
        
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDateTime startDate = monthStart.atStartOfDay();
        LocalDateTime endDate = today.atTime(23, 59, 59);
        
        List<Object[]> statsData = dashboardRepository.getDashboardStatsByDateRange(startDate, endDate);
        List<Object[]> sourceStats = dashboardRepository.getOrderSourceStats(startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("month", monthStart.format(DateTimeFormatter.ofPattern("MMMM yyyy")));
        
        if (!statsData.isEmpty()) {
            Object[] row = statsData.get(0);
            Long totalOrders = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            Double totalRevenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            Long uniqueCustomers = row[7] != null ? ((Number) row[7]).longValue() : 0L;
            int daysInMonth = today.lengthOfMonth();
            
            stats.put("totalOrders", totalOrders);
            stats.put("totalRevenue", totalRevenue);
            stats.put("averageDailyRevenue", totalRevenue / daysInMonth);
            stats.put("totalCustomers", uniqueCustomers);
        } else {
            stats.put("totalOrders", 0L);
            stats.put("totalRevenue", 0.0);
            stats.put("averageDailyRevenue", 0.0);
            stats.put("totalCustomers", 0L);
        }
        
        // ✅ Add monthly order source stats
        Long dineInOrders = 0L;
        Long takeawayOrders = 0L;
        Long deliveryOrders = 0L;
        
        for (Object[] source : sourceStats) {
            String sourceName = (String) source[0];
            Long count = ((Number) source[1]).longValue();
            if ("DINE_IN".equals(sourceName)) {
                dineInOrders = count;
            } else if ("TAKEAWAY".equals(sourceName)) {
                takeawayOrders = count;
            } else if ("DELIVERY".equals(sourceName)) {
                deliveryOrders = count;
            }
        }
        
        stats.put("monthlyDineInOrders", dineInOrders);
        stats.put("monthlyTakeawayOrders", takeawayOrders);
        stats.put("monthlyDeliveryOrders", deliveryOrders);
        
        return stats;
    }

    @Override
    public Map<String, Object> getOverallStats() {
        log.info("Getting overall stats...");
        
        LocalDateTime startDate = LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.now();
        
        List<Object[]> statsData = dashboardRepository.getDashboardStatsByDateRange(startDate, endDate);
        List<Object[]> sourceStats = dashboardRepository.getOrderSourceStats(startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        
        if (!statsData.isEmpty()) {
            Object[] row = statsData.get(0);
            Long totalOrders = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            Double totalRevenue = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            Long uniqueCustomers = row[7] != null ? ((Number) row[7]).longValue() : 0L;
            
            stats.put("totalOrders", totalOrders);
            stats.put("totalRevenue", totalRevenue);
            stats.put("averageOrderValue", totalOrders > 0 ? totalRevenue / totalOrders : 0.0);
            stats.put("totalCustomers", uniqueCustomers);
        } else {
            stats.put("totalOrders", 0L);
            stats.put("totalRevenue", 0.0);
            stats.put("averageOrderValue", 0.0);
            stats.put("totalCustomers", 0L);
        }
        
        // ✅ Add overall order source stats
        Long dineInOrders = 0L;
        Long takeawayOrders = 0L;
        Long deliveryOrders = 0L;
        
        for (Object[] source : sourceStats) {
            String sourceName = (String) source[0];
            Long count = ((Number) source[1]).longValue();
            if ("DINE_IN".equals(sourceName)) {
                dineInOrders = count;
            } else if ("TAKEAWAY".equals(sourceName)) {
                takeawayOrders = count;
            } else if ("DELIVERY".equals(sourceName)) {
                deliveryOrders = count;
            }
        }
        
        stats.put("overallDineInOrders", dineInOrders);
        stats.put("overallTakeawayOrders", takeawayOrders);
        stats.put("overallDeliveryOrders", deliveryOrders);
        
        // Additional stats from other repositories
        stats.put("totalProducts", 0L);
        stats.put("totalCategories", 0L);
        stats.put("totalUsers", 0L);
        
        return stats;
    }

    @Override
    public List<Order> getRecentOrders(int limit) {
        log.info("Getting {} recent orders...", limit);
        return dashboardRepository.findRecentOrders(limit);
    }

    @Override
    public List<Object[]> getTopProducts(int limit) {
        log.info("Getting top {} products...", limit);
        return dashboardRepository.findTopProducts(limit, 30);
    }

    @Override
    public List<Object[]> getSalesTrend(int days) {
        log.info("Getting sales trend for last {} days...", days);
        return dashboardRepository.findSalesTrend(days);
    }

    @Override
    public List<Inventory> getLowStockItems() {
        log.info("Getting low stock items...");
        return dashboardRepository.findLowStockItems();
    }

    @Override
    public Map<String, Object> getDashboardSummary() {
        log.info("Getting complete dashboard summary...");
        
        Long occupiedTables = tableRepository.countByStatus("OCCUPIED");
        Long availableTables = tableRepository.countByStatus("AVAILABLE");
        Long totalTables = tableRepository.count();
        
        log.info("Table Stats - Occupied: {}, Available: {}, Total: {}", 
                occupiedTables, availableTables, totalTables);
        
        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("todayStats", getTodayStats());
        dashboard.put("weeklyStats", getWeeklyStats());
        dashboard.put("monthlyStats", getMonthlyStats());
        dashboard.put("overallStats", getOverallStats());
        dashboard.put("recentOrders", getRecentOrders(10));
        dashboard.put("topProducts", getTopProducts(5));
        dashboard.put("salesTrend", getSalesTrend(7));
        dashboard.put("lowStockItems", getLowStockItems());
        dashboard.put("lowStockCount", dashboardRepository.countLowStockItems());
        
        dashboard.put("activeTables", occupiedTables != null ? occupiedTables : 0L);
        dashboard.put("availableTables", availableTables != null ? availableTables : 0L);
        dashboard.put("totalTables", totalTables != null ? totalTables : 0L);
        
        return dashboard;
    }
}