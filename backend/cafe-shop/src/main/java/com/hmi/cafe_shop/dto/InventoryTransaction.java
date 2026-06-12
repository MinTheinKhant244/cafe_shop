// InventoryTransaction.java
package com.hmi.cafe_shop.dto;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.hmi.cafe_shop.entity.Inventory;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(nullable = false)
    private String transactionType; // PURCHASE, USAGE, ADJUSTMENT, RETURN, WASTAGE

    @Column(nullable = false)
    private Double quantityChange;

    @Column(nullable = false)
    private Double oldQuantity;

    @Column(nullable = false)
    private Double newQuantity;

    private Double unitPrice;

    private String referenceId; // invoice_no, recipe_id, order_id

    @Column(length = 500)
    private String notes;

    private String performedBy;

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    @PrePersist
    protected void onCreate() {
        transactionDate = LocalDateTime.now();
    }
}