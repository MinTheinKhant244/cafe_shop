package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Dashboard;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TableRepository tableRepository;

    @Override
    public Dashboard getDashboardSummary() {
        Dashboard summary = new Dashboard();
        
        // Today's Revenue
        summary.setTotalRevenue(orderRepository.sumTotalAmountByDate(LocalDateTime.now().toLocalDate()));

        Double totalAmount = orderRepository.sumTotalAmountByDate(LocalDate.now());
        double revenue = (totalAmount != null) ? totalAmount : 0.0;

        summary.setTotalOrders(orderRepository.count());
        
        summary.setActiveTables(tableRepository.countByStatus("OCCUPIED"));
        
        summary.setPendingOrders(orderRepository.countByStatus("PENDING"));
        
        return summary;
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