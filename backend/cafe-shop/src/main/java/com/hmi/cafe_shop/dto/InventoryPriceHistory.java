// InventoryPriceHistory.java
package com.hmi.cafe_shop.dto;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.hmi.cafe_shop.entity.Inventory;

@Entity
@Table(name = "inventory_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryPriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    private Double oldPrice;

    @Column(nullable = false)
    private Double newPrice;

    private String changeReason;

    private String changedBy;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }
}