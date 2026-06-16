package com.hmi.cafe_shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders")
public class Order {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceNo;

    @ManyToOne
    private User createdBy;

    @ManyToOne
    private TableEntity table;

    // Optional: combine tables
    private String combinedTables;

    private Double totalAmount;

    private String status; // PREPARING, COMPLETED, CANCELLED

    private String paymentStatus; // PENDING, PAID

    private String paymentMethod; // CASH, KPAY, CARD

    private String orderSource; // DINE_IN, TAKEAWAY, DELIVERY

    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String orderNote;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<OrderItem> orderItems;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    @JsonIgnore
    private Payment payment;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (status == null) status = "PENDING";
        if (paymentStatus == null) paymentStatus = "PENDING";
    }
}