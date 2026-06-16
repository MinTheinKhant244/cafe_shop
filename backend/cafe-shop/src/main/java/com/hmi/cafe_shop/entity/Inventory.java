package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    
    @Column(nullable = false)
    private Double currentPrice = 0.0;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, DISCONTINUED

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    
    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;
    
    @Column(name = "deactivated_by")
    private String deactivatedBy;
    
    @OneToMany(mappedBy = "inventory", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<InventoryTransaction> transactions = new ArrayList<>();

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