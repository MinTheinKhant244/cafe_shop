package com.hmi.cafe_shop.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private Integer quantity;
    private Double price;
    
    @Column(name = "total_price")
    private Double totalPrice;

    @PrePersist
    @PreUpdate
    private void calculateTotalPrice() {
        if (price != null && quantity != null) {
            this.totalPrice = price * quantity;
        }
    }
}
