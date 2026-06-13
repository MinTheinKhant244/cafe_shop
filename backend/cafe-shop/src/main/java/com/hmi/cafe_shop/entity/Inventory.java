// Inventory.java - Add price fields
package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Column(length = 20)
    private String unit;

    @Column(nullable = false)
    private Double quantity;

    private Double lowStockThreshold;
    
    // ✅ Add price fields
    @Column(nullable = false)
    private Double currentPrice = 0.0; // လက်ရှိဝယ်ယူဈေး
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, DISCONTINUED

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.quantity == null) this.quantity = 0.0;
        if (this.lowStockThreshold == null) this.lowStockThreshold = 10.0;
        if (this.currentPrice == null) this.currentPrice = 0.0;
        if (this.status == null) this.status = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}