package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Dashboard;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.DashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;

    @Override
    public Dashboard getDashboardSummary() {

        LocalDate today = LocalDate.now();

        Double revenue = getTodayRevenue(today);
        Long orders = getTodayOrders(today);
        Long pending = getPendingOrders();

        Dashboard d = new Dashboard();
        d.setTotalRevenue(revenue);
        d.setTotalOrders(orders);
        d.setActiveTables(tableRepository.countByStatus("OCCUPIED"));
        d.setPendingOrders(pending);

        return d;
    }

    @Override
    public Double getTodayRevenue(LocalDate date) {
        Double revenue = orderRepository.sumTotalAmountByDate(date);
        return (revenue == null) ? 0.0 : revenue;
    }

    @Override
    public Long getTodayOrders(LocalDate date) {
        // today orders count (better than total count)
        return orderRepository.countByCreatedAtDate(date);
    }

    @Override
    public Long getPendingOrders() {
        return orderRepository.countByStatus("PENDING");
    }

    @Override
    public List<Map<String, Object>> getSalesTrend(int days) {
        return orderRepository.findSalesTrend(days);
    }

    @Override
    public List<Map<String, Object>> getTopProducts() {
        return orderRepository.findTopSellingProducts();
    }
}