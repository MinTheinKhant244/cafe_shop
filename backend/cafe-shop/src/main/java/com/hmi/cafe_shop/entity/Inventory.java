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

    @Column(nullable = false)
    private String name;

    private String unit;

    @Column(nullable = false)
    private Double quantity;

    private Double lowStockThreshold;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void updateTime() {
        this.updatedAt = LocalDateTime.now();
    }
}