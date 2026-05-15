package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.Order;
import com.hmi.cafe_shop.repository.OrderRepository;
import com.hmi.cafe_shop.repository.UserRepository;
import com.hmi.cafe_shop.service.OrderService;
import com.hmi.cafe_shop.repository.TableRepository; 
import com.hmi.cafe_shop.util.InvoiceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor // Repository များကို Auto Inject လုပ်ပေးသည်
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;   
    private final TableRepository tableRepository;

    @Override
    public Order createOrder(Order order) {
    	// invoice number auto generate
    	order.setInvoiceNo(InvoiceGenerator.generateInvoiceNo());
        if (order.getCreatedBy() != null && order.getCreatedBy().getId() != null) {
            userRepository.findById(order.getCreatedBy().getId())
                    .ifPresent(order::setCreatedBy);
        }
        if (order.getTable() != null && order.getTable().getId() != null) {
            tableRepository.findById(order.getTable().getId())
                    .ifPresent(order::setTable);
        }
        
        if (order.getStatus() == null) order.setStatus("PREPARING");
        if (order.getPaymentStatus() == null) order.setPaymentStatus("PENDING");

        return orderRepository.save(order);
    }

    @Override
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Override
    public Optional<Order> getOrderByInvoiceNo(String invoiceNo) {
        return orderRepository.findByInvoiceNo(invoiceNo);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    @Override
    public Order updateOrderStatus(Long id, String status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    @Override
    public Order updatePaymentStatus(Long id, String paymentStatus) {
        return orderRepository.findById(id).map(order -> {
            order.setPaymentStatus(paymentStatus);
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }
}