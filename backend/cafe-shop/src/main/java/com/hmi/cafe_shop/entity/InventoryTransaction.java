package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(nullable = false, length = 20)
    private String transactionType; // STOCK_IN, STOCK_OUT, ADJUSTMENT, INITIAL

    @Column(nullable = false)
    private Double quantity; // + အတွက် positive, - အတွက် negative

    @Column(nullable = false)
    private Double unitPrice; // ထိုအချိန်က ဈေးနှုန်း

    @Column(nullable = false)
    private Double beforeQuantity; // မလုပ်ခင်က quantity

    @Column(nullable = false)
    private Double afterQuantity; // လုပ်ပြီးနောက် quantity

    private String referenceNo; // PO-001, SALE-123, ADJ-456 စသည်

    private String remark; // မှတ်ချက်

    @Column(length = 50)
    private String createdBy; // ဘယ်သူလုပ်တယ်

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.transactionDate == null) {
            this.transactionDate = LocalDateTime.now();
        }
    }
}