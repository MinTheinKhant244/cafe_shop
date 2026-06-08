package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.OrderItem;
import com.hmi.cafe_shop.repository.OrderItemRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    @Override
    public OrderItem addOrderItem(OrderItem orderItem) {
        if (orderItem.getProduct() != null && orderItem.getProduct().getId() != null) {
            productRepository.findById(orderItem.getProduct().getId())
                    .ifPresent(product -> {
                        orderItem.setProduct(product);
                        if (orderItem.getPrice() == null) {
                            orderItem.setPrice(product.getPrice());
                        }
                    });
        }
        return orderItemRepository.save(orderItem);
    }

    @Override
    public List<OrderItem> getItemsByOrderId(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    @Override
    public void deleteOrderItem(Long id) {
        orderItemRepository.deleteById(id);
    }
}