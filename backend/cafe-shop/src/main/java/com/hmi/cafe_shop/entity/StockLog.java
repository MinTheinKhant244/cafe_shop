package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_logs")
public class StockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_cost")
    private Double unitCost;

    @Column(name = "reference_type", nullable = false)
    private String referenceType; // SALE, PURCHASE, DAMAGE, ADJUSTMENT

    @Column(name = "reference_id")
    private Long referenceId; //  Order ID (or) PO ID

    @Column(name = "logged_at", updatable = false)
    private LocalDateTime loggedAt;
    
    @Column(name = "expire_date")
    private LocalDate expireDate;
    
    private String remarks;

    @PrePersist
    protected void onCreate() {
        this.loggedAt = LocalDateTime.now();
    }
}